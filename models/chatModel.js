import mongoose, { Schema, Types, model } from 'mongoose';


const userSchema = new Schema({
  name: { type: String, required: true },
  groupChat: { type: Boolean, default: false },
  creator: { type: Types.ObjectId, ref: "User" }, // Password is hidden by default (used middleware to show it when needed)
  members: [{
    type: Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });





export const Chat = mongoose.models.Chat || model('Chat', userSchema);