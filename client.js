import readline from 'readline';
import { io } from 'socket.io-client';
import { encrypt, decrypt } from './encryption.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const socket = io('http://localhost:3000');

let currentUser = '';
let chatMode = null;
let chatTarget = null;

socket.on('login_approved', (user) => {
  currentUser = user;
  console.log(`\nWelcome back, ${currentUser}!`);
  initiateChatMode();
});

socket.on('login_rejected', (message) => {
  console.log(`\nLogin failed: ${message}`);
  process.exit(1);
});

socket.on('registration_success', (message) => {
  console.log(`\n${message}`);
  process.exit(0);
});

socket.on('receive_direct_message', ({ sender, content }) => {
  console.log(`\n[PRIVATE] ${sender}: ${decrypt(content)}`);
  getInput();
});

socket.on('receive_group_message', ({ sender, content }) => {
  console.log(`\n[GROUP] ${sender}: ${decrypt(content)}`);
  getInput();
});

function authenticateUser() {
  rl.question('Enter your username: ', (username) => {
    rl.question('Enter your password: ', (password) => {
      socket.emit('user_auth', { username, password });
    });
  });
}

function initiateChatMode() {
  rl.question('\nSelect chat mode:\n1) Private Chat\n2) Group Chat\n> ', (option) => {
    if (option === '1') {
      chatMode = 'private';
      rl.question('Enter the username to chat with: ', (username) => {
        chatTarget = username;
        socket.emit('fetch_private_conversations', { withUser: chatTarget });
        getInput();
      });
    } else if (option === '2') {
      chatMode = 'group';
      rl.question('Enter group name: ', (group) => {
        chatTarget = group;
        socket.emit('join_group', group);
        getInput();
      });
    } else {
      console.log('Invalid choice. Try again.');
      initiateChatMode();
    }
  });
}

function getInput() {
  rl.question(`${chatMode === 'private' ? `[${chatTarget}]` : `[${chatTarget} Group]`} ---> `, (message) => {
    if (message.trim().toLowerCase() === '/menu') {
      chatMode = null;
      chatTarget = null;
      initiateChatMode();
      return;
    }

    const encryptedMessage = encrypt(message);

    if (chatMode === 'private') {
      socket.emit('send_direct_message', { recipient: chatTarget, content: encryptedMessage });
    } else if (chatMode === 'group') {
      socket.emit('send_group_message', { group: chatTarget, content: encryptedMessage });
    }

    getInput();
  });
}

authenticateUser();