import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import dbMethods from './connectDB.js';
import { User } from './models/user.model.js';
import { PrivateMessage } from './models/privateMessage.model.js';
import { RoomMessage } from './models/roomMessage.model.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

await dbMethods.connectDB();

const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('user_auth', async ({ username, password }) => {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      if (existingUser.password === password) {
        activeUsers[socket.id] = username;
        socket.emit('login_approved', username);
        console.log(`${username} authenticated.`);
      } else {
        socket.emit('login_rejected', 'Password incorrect');
        socket.disconnect();
      }
    } else {
      await User.create({ username, password });
      socket.emit('registration_success', 'User successfully registered. Restart to login.');
      socket.disconnect();
    }
  });

  socket.on('send_direct_message', async ({ recipient, content }) => {
    const sender = activeUsers[socket.id];
    const recipientSocket = Object.keys(activeUsers).find(key => activeUsers[key] === recipient);

    if (recipientSocket) {
      io.to(recipientSocket).emit('receive_direct_message', { sender, content });
    }

    await PrivateMessage.create({ from: sender, to: recipient, message: content });
  });

  socket.on('join_group', async (group) => {
    const user = activeUsers[socket.id];
    socket.join(group);
    console.log(`${user} joined group ${group}`);

    const messages = await RoomMessage.find({ room: group }).sort({ timestamp: 1 });
    messages.forEach(({ from, message }) => {
      socket.emit('receive_group_message', { sender: from, content: message });
    });
  });

  socket.on('send_group_message', async ({ group, content }) => {
    const sender = activeUsers[socket.id];
    io.to(group).emit('receive_group_message', { sender, content });
    await RoomMessage.create({ room: group, from: sender, message: content });
  });

  socket.on('fetch_private_conversations', async ({ withUser }) => {
    const currentUser = activeUsers[socket.id];
    const conversations = await PrivateMessage.find({
      $or: [
        { from: currentUser, to: withUser },
        { from: withUser, to: currentUser }
      ]
    }).sort({ timestamp: 1 });

    conversations.forEach(({ from, message }) => {
      socket.emit('receive_direct_message', { sender: from, content: message });
    });
  });

  socket.on('disconnect', () => {
    console.log(`${activeUsers[socket.id] || 'Unknown user'} disconnected`);
    delete activeUsers[socket.id];
  });
});

server.listen(3000, () => console.log('Server is running on port 3000'));
