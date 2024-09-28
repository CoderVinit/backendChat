import { envMode } from "../app.js";



const errorMiddleware = async (err, req, res, next) => {

  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",")
    err.msg = `Duplicate ${error}`;
    err.statusCode = 400;
  }

  if (err.name === "CastError") {
    const errorPath = err.path;
    err.msg = `Invalid formate of ${errorPath}`;
    err.statusCode = 404;
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message
  });

}

const TryCatch = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res, next)
  } catch (error) {
    next(error.message)
  }
}


export { errorMiddleware, TryCatch }