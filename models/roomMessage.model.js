import mongoose from "mongoose";

const roomMessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: [true, "Room name is required"],
    trim: true,
    unique: false,  // Burada `unique: true` silinib
  },
  from: {
    type: String,
    required: [true, "From is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const RoomMessage = mongoose.model("RoomMessage", roomMessageSchema);

