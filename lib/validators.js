import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utitlity.js";

const validate = (req, res, next) => {

  const error = validationResult(req);

  const errorMessages = error.array().map(error => error.msg).join(",");

  if (error.isEmpty()) {
    return next()
  }
  else next(new ErrorHandler(errorMessages, 400))

}

const registerValidators = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  body("bio", "Please Enter Bio").notEmpty(),
]
const loginValidators = () => [
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
]
const newGroupChatValidators = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("members").notEmpty().withMessage("Please select Members").isArray({ min: 2, max: 100 }).withMessage("Members must be 2-100"),
]
const addMembersValidators = () => [
  body("chatId", "Please Enter ChatId").notEmpty(),
  body("members").notEmpty().withMessage("Please add Members").isArray({ min: 1, max: 97 }).withMessage("Members must be 1-97"),
]
const removeMemberValidators = () => [
  body("userId", "Please Enter userId").notEmpty(),
  body("chatId", "Please Enter ChatId").notEmpty(),
]
const leaveGroupValidators = () => [
  param("id", "Please Enter chatId").notEmpty(),
]
const sendAttachmentsValidators = () => [
  body("chatId", "Please Enter chatId").notEmpty(),
]
const chatIdValidators = () => [
  param("id", "Please Enter chatId").notEmpty(),
]
const renameGroupValidators = () => [
  param("id", "Please Enter chatId").notEmpty(),
  body("name", "Please Enter Name").notEmpty(),
]
const sendRequestValidators = () => [
  body("userId", "Please Enter User ID").notEmpty(),
]
const acceptRequestValidators = () => [
  body("requestId", "Please Enter Request ID").notEmpty(),
  body("accept").notEmpty().withMessage("Please select Accept").isBoolean().withMessage("Accept must be boolean")
]

const adminLoginValidators = () => [
  body("secretKey", "Enter your secret key").notEmpty()
]






export { acceptRequestValidators, addMembersValidators, adminLoginValidators, chatIdValidators, leaveGroupValidators, loginValidators, newGroupChatValidators, registerValidators, removeMemberValidators, renameGroupValidators, sendAttachmentsValidators, sendRequestValidators, validate };

