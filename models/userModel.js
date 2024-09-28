import mongoose, { Schema, model } from 'mongoose';
import pkg from 'bcryptjs';
const {bcrypt} = pkg;



const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // Password is hidden by default (used middleware to show it when needed)
  bio: { type: String, default: '' },
  avatar: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }
}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 10);
})





export const User = mongoose.models.User || model('User', userSchema);