import mongoose from "mongoose"
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid"
import { getBase64, getSockets } from "../lib/helper.js";
import { v2 as cloudinary } from 'cloudinary'
import { ErrorHandler } from "./utitlity.js";

const cookieOption = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure: true
}

const connectDb = (uri) => {
  try {
    mongoose.connect(uri);
    console.log("MongoDB Connected...");
  } catch (error) {
    return next(new ErrorHandler(error.message, 301))
  }
}


const sendToken = (res, user, code, message) => {

  const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY);

  return res.status(code).cookie("token", token, cookieOption).json({
    success: true,
    message,
    user
  });
}

const emitEvent = (req, event, users, data) => {

  const io = req.app.get("io");

  const usersScoket = getSockets(users)

  io.to(usersScoket).emit(event, data)

  console.log("Emmiting event", event)
}

const uploadFilesToCloudinary = async (files = []) => {

  const uploadedFiles = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid()
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        })
    })
  })

  try {
    const results = await Promise.all(uploadedFiles)

    const formattedResult = results.map(result => {
      return {
        url: result.secure_url,
        public_id: result.public_id
      }
    })
    return formattedResult;
  } catch (error) {
    throw new Error("Error uploading files to cloudinary", error)
  }

}


const deleteFilesFromCloudinary = async (public_ids) => { }

export { connectDb, sendToken, cookieOption, emitEvent, deleteFilesFromCloudinary, uploadFilesToCloudinary };