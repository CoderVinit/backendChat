import { TryCatch } from "../middleware/error.js";
import { User } from "../models/userModel.js";
import { Chat } from "../models/chatModel.js";
import { Message } from "../models/messageModel.js";
import jwt from "jsonwebtoken";
import { cookieOption } from "../utils/features.js";
import { ErrorHandler } from "../utils/utitlity.js";
import { adminSecretKey } from "../app.js";



const loginAdmin = TryCatch(async (req, res, next) => {

  const { secretKey } = req.body;

  const matched = secretKey === adminSecretKey;

  if (!matched) return next(new ErrorHandler("Invalid Secret Key", 401))

  const token = jwt.sign(adminSecretKey, process.env.SECRET_KEY);

  res.status(200).cookie("admin-token", token, { ...cookieOption, maxAge: 1000 * 60 * 15 }).json({ success: true, message: "Login Successful" })

})

const adminLogout = TryCatch(async (req, res, next) => {
  return res.status(200).cookie("admin-token", "", { ...cookieOption, maxAge: 1000 * 0 }).json({ success: true, message: "logout Successful" })
})

const getAdminData = TryCatch(async (req, res, next) => {
  return res.status(200).json({ success: true, admin: true })
})


const allUsers = TryCatch(async (req, res, next) => {


  const users = await User.find({});

  const transformedUser = await Promise.all(users.map(async ({ _id, name, username, avatar }) => {

    const [groups, friends] = await Promise.all([
      Chat.countDocuments({ groupChat: true, members: _id }),
      Chat.countDocuments({ groupChat: false, members: _id })
    ])
    return {
      _id, name, username, avatar: avatar.url, groups, friends
    }
  }))

  return res.status(200).json({ success: true, Users: transformedUser })

})


const allChats = TryCatch(async (req, res, next) => {

  const chats = await Chat.find({}).populate("members", "name avatar").populate("creator", "name avatar");

  const transformedChat = await Promise.all(chats.map(async ({ _id, members, creator, groupChat, name }) => {

    const totalMessages = await Message.countDocuments({ chat: _id })

    return {
      _id, name,
      creator: {
        name: creator?.name || "None",
        avatar: creator?.avatar.url || ""
      },
      groupChat,
      avatar: members.slice(0, 3).map((member) => member.avatar.url),
      members: members.map(({ _id, name, avatar }) => (
        {
          _id,
          name,
          avatar: avatar.url
        }
      )),
      totalMembers: members.length,
      totalMessages
    }
  }))




  return res.status(200).json({ success: true, chats: transformedChat })

})

const allMessages = TryCatch(async (req, res, next) => {

  const messages = await Message.find({}).populate("sender", "name avatar").populate("chat", "groupChat");

  const transformedMessages = messages.map(({ _id, chat, sender, content, createdAt, attachments }) => ({
    _id,
    chat: chat?._id,
    groupChat: chat?.groupChat,
    attachments,
    content,
    createdAt,
    sender: {
      _id: sender?._id,
      name: sender?.name,
      avatar: sender?.avatar.url
    }
  }))



  return res.status(200).json({ success: true, messages: transformedMessages })
})


const getDashBoardStats = TryCatch(async (req, res, next) => {


  const [groupsCount, userCount, messageCount, totalChatsCount] = await Promise.all([
    Chat.countDocuments({ groupChat: true }),
    User.countDocuments(),
    Message.countDocuments(),
    Chat.countDocuments()
  ])

  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({ createdAt: { $gte: last7Days } }).select("createdAt");

  const messages = new Array(7).fill(0);

  last7DaysMessages.forEach((message) => {
    const index = Math.floor((today.getDate() - message.createdAt.getDate()) / (1000 * 60 * 60 * 24))
    messages[6 - index]++;
  })

  const stats = {
    groupsCount,
    userCount,
    messageCount,
    totalChatsCount,
    last7DaysMessages: messages,
  }

  res.status(200).json({ success: true, stats })

})










export { allUsers, allChats, allMessages, getDashBoardStats, loginAdmin, adminLogout, getAdminData }