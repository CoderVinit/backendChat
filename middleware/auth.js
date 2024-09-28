import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utitlity.js";
import { adminSecretKey } from "../app.js";
import { TOKEN } from "../constants/config.js";
import { User } from "../models/userModel.js";



const isAuthenticated = async (req, res, next) => {
  const token = req.cookies[TOKEN];
  if (!token) {
    return next(new ErrorHandler("please login to access this routes", 401));
  };

  const decodedData = jwt.verify(token, process.env.SECRET_KEY);
  req.user = decodedData._id;
  next();
}


const adminOnly = async (req, res, next) => {
  const token = req.cookies["admin-token"];
  if (!token) {
    return next(new ErrorHandler("Only admin can access this routes", 401));
  };

  const secretKey = jwt.verify(token, process.env.SECRET_KEY);

  const matched = secretKey === adminSecretKey;

  if (!matched) {
    return next(new ErrorHandler("Only admin can access this routes", 401));
  }

  next();
}


const socketAuthenticator = async (err, socket, next) => {


  try {
    if (err) {
      return next(err);
    }
    const authToken = socket.request.cookies[TOKEN];
    if (!authToken) {
      return next(new ErrorHandler("Please login to access this route", 401));
    }

    const decodeData = jwt.verify(authToken, process.env.SECRET_KEY);

    const user = await User.findById(decodeData._id);

    if (!user) {
      return next(new ErrorHandler("Please login to access this route", 401));
    }

    socket.user = user;

    return next();


  } catch (error) {
    console.log(error)
    return next(new ErrorHandler("Please login to access this route", 401));
  }

}


export { isAuthenticated, adminOnly, socketAuthenticator }