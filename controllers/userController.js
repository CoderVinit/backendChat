import { User } from "../models/userModel.js";
import { Chat } from "../models/chatModel.js";
import { sendToken, cookieOption, emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utitlity.js";
import { TryCatch } from "../middleware/error.js";
import { Request } from '../models/requestModels.js'
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherGroupMembers } from '../lib/helper.js'
import bcrypt from "bcryptjs";




const newUser = TryCatch(async (req, res, next) => {

  const { name, username, password, bio } = req.body;

  const file = req.file;

  if (!file) return next(new ErrorHandler("Please upload an avatar", 400))


  const results = await uploadFilesToCloudinary([file])


  const avatar = {
    public_id: results[0].public_id,
    url: results[0].url
  }

  const user = await User.create({ name, bio, username, password, avatar })

  sendToken(res, user, 201, "User created!")
})


const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }

  const isMatched = bcrypt.compare(password, user?.password);

  if (!isMatched) return next(new ErrorHandler("Invalid Password", 400));

  // Send token to the client
  sendToken(res, user, 200, `welcome back ${user.name}`);

})


const getMyProfile = TryCatch(async (req, res, next) => {

  const user = await User.findById(req.user);

  if (!user) {
    return next(new ErrorHandler("User not found", 404))
  }

  res.status(200).json({
    success: true,
    data: user
  })
})

const logout = TryCatch(async (req, res) => {

  return res.status(200).cookie("token", "", { ...cookieOption, maxAge: 0 }).json({
    success: true,
    message: "Logout Successfully"
  })
})

const searchUser = TryCatch(async (req, res) => {

  const { name = "" } = req.query;

  const myChats = await Chat.find({ groupChat: false, members: req.user })

  const allUsersFromMyChats = myChats.map((chat) => chat.members).flat();

  const allUsersExceptMeAndFriend = await User.find({ _id: { $nin: allUsersFromMyChats }, name: { $regex: name, $options: "i" } })

  const others = allUsersExceptMeAndFriend.map(({ _id, name, avatar }) => ({ _id, name, avatar: avatar.url }))

  return res.status(200).json({
    success: true,
    others
  })
})

const sendFriendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;


  if (userId === req.user) {
    return next(new ErrorHandler("You can't send friend request to yourself", 400))
  }

  const request = await Request.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user }
    ]
  })

  if (request) {
    return next(new ErrorHandler("You have already sent a friend request", 400))
  }

  await Request.create({ sender: req.user, receiver: userId })

  emitEvent(req, NEW_REQUEST, [userId])


  return res.status(200).json({ success: true, message: "Friend request sent" })

})

const acceptFriendRequest = TryCatch(async (req, res, next) => {

  const { requestId, accept } = req.body;

  const request = await Request.findById(requestId).populate("sender", "name").populate("receiver", "name");


  if (!request) return next(new ErrorHandler("Request not Found", 400))
  if (request.receiver._id.toString() !== req.user.toString()) {
    return next(new ErrorHandler("You are not authorized to accept this request", 400))
  }
  if (!accept) {
    await request.deleteOne();
    return res.status(200).json({ success: true, message: "Friend request rejected" })
  }
  const members = [request.sender._id, request.receiver._id]
  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`
    }),
    request.deleteOne(),
  ])


  emitEvent(req, REFETCH_CHATS, members);


  return res.status(200).json({ success: true, message: "Request Accepted", senderId: request.sender._id });

})

const getMyNotifications = TryCatch(async (req, res) => {

  const request = await Request.find({ receiver: req.user }).populate("sender", "name avatar")

  const allrequest = request.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url
    }
  }))
  return res.status(200).json({ success: true, allrequest })

})

const getMyFriends = TryCatch(async (req, res, next) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({ members: req.user, groupChat: false }).populate("members", "name avatar")
  if (!chats) {
    return next(new ErrorHandler("Chat not found", 404))
  }

  const friends = chats.map(({ members }) => {
    const otherUser = getOtherGroupMembers(members, req.user)
    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    }
  })

  if (chatId) {
    const chat = await Chat.findById(chatId);
    const availableFriends = friends.filter((friend) => !chat.members.includes(friend._id))
    return res.status(200).json({ success: true, availableFriends })
  }
  else {
    return res.status(200).json({ success: true, friends })
  }

})




export { login, newUser, getMyProfile, logout, searchUser, sendFriendRequest, acceptFriendRequest, getMyNotifications, getMyFriends }