import { ALERT, NEW_MESSAGE, NEW_MESSAGES_ALERT, REFETCH_CHATS } from '../constants/events.js';
import { getOtherGroupMembers } from '../lib/helper.js';
import { TryCatch } from '../middleware/error.js';
import { Chat } from '../models/chatModel.js';
import { Message } from '../models/messageModel.js';
import { User } from '../models/userModel.js';
import { deleteFilesFromCloudinary, emitEvent, uploadFilesToCloudinary } from '../utils/features.js';
import { ErrorHandler } from '../utils/utitlity.js';



const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;


  const allMembers = [...members, req.user];
  await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members: allMembers,
  })
  emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`)
  emitEvent(req, REFETCH_CHATS, members)

  return res.status(201).json({ success: true, message: "Group Created Successfully" })
});



const getMyChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user }).populate('members', "name avatar");

  const transformedChats = chats.map(({ _id, members, name, groupChat }) => {


    const otherMembers = getOtherGroupMembers(members, req.user)

    return {
      _id,
      groupChat,
      name: groupChat ? name : otherMembers.name,
      members: members.reduce((prev, curr) => {
        if (curr._id !== req.user) {
          prev.push(curr._id)
        }
        return prev;
      }, []),

      avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => avatar.url) : [otherMembers.avatar.url],
    }
  })

  return res.status(200).json({ success: true, message: "Group Created Successfully", chats: transformedChats })
})


const getMyGroups = TryCatch(async (req, res, next) => {

  const chats = await Chat.find({ members: req.user, groupChat: true, creator: req.user }).populate('members', "name avatar");


  const groups = chats.map(({ _id, members, name, groupChat }) => ({
    _id, members, name, groupChat,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
  }))


  return res.status(200).json({ success: true, message: "Group Created Successfully", groups: groups })

})


const addMembers = TryCatch(async (req, res, next) => {

  const { chatId, members } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat.groupChat) {
    return next(new ErrorHandler('This is not a group chat', 400));
  };
  if (!chat) {
    return next(new ErrorHandler('Chat not found', 404));
  };

  if (!chat.members.map(i => i.toString()).includes(req.user.toString())) {
    return next(new ErrorHandler('You are not member of this group', 400));
  }

  if (chat.creator.toString() !== req.user.toString()) {
    return next(new ErrorHandler('Only the creator can add members', 404));
  }

  const allMembersPromise = members.map((i) => User.findById(i, "name"))

  const allNewMembers = await Promise.all(allMembersPromise);

  const uniqueMembers = allNewMembers.filter((i) => !chat.members.includes(i._id.toString())).map((i) => i._id);

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 50) {
    return next(new ErrorHandler('Group members limit reached', 400));
  }

  await chat.save();

  const allUserName = allNewMembers.map((i) => i.name).join(",");

  emitEvent(req, ALERT, chat.members, { message: `${allUserName} has been added to the group`, chatId });
  emitEvent(req, REFETCH_CHATS, chat.members);



  return res.status(200).json({ success: true, message: "Members added successfully" })

})

const removeMember = TryCatch(async (req, res, next) => {
  const { chatId, userId } = req.body;

  const [chat, userThatWillBeRemoved] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name")
  ]);

  if (!chat.groupChat) {
    return next(new ErrorHandler("This is not a group chat", 400));
  }
  if (!chat) {
    return next(new ErrorHandler("Chat not found", 404));
  }

  if (chat.creator.toString() !== req.user.toString()) {
    return next(new ErrorHandler("Only the creator can remove members", 404));
  }

  if (chat.members.length <= 3) return next(new ErrorHandler("Group have atleast 3 members", 200));


  const allChatMembers = chat.members.map((i) => i.toString());
  chat.members = chat.members.filter(i => i.toString() !== userId);

  await chat.save();

  emitEvent(req, ALERT, chat.members, { message: `${userThatWillBeRemoved.name} has been removed from the group`, chatId });
  emitEvent(req, REFETCH_CHATS, allChatMembers);

  return res.status(200).json({ success: true, message: `${userThatWillBeRemoved.name} has been removed from the group` })

})

const leaveGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);

  if (!chat.groupChat) {
    return next(new ErrorHandler("This is not a group chat", 400));
  }
  if (!chat) {
    return next(new ErrorHandler("Chat not found", 404));
  }

  const remainingMembers = chat.members.filter(i => i.toString() !== req.user.toString());

  if (remainingMembers.length < 3) {
    return next(new ErrorHandler("Group must have atleast 3 members", 400));
  }

  if (chat.creator.toString() === req.user.toString()) {
    const randomElement = Math.floor(Math.random() * remainingMembers.length);
    chat.creator = remainingMembers[randomElement];
  }

  chat.members = remainingMembers;

  const [user] = await Promise.all([User.findById(req.user, "name"), chat.save()]);

  emitEvent(req, ALERT, chat.members, { message: `${user.name} has leave the group`, chatId });

  return res.status(200).json({ success: true, message: `${user.name} has left the group` })

})

const sendAttachments = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;


  const files = req.files || [];

  if (files.length < 1) {
    return next(new ErrorHandler('Please select atleast one file', 400));
  }
  if (files.length > 5) {
    return next(new ErrorHandler("files cann't be more than 5", 400));
  }


  const [chat, user] = await Promise.all([Chat.findById(chatId), User.findById(req.user, "name")]);

  if (!chat) {
    return next(new ErrorHandler('Chat not found', 404));
  }


  //Upload files here

  const attachments = await uploadFilesToCloudinary(files)

  const messageForRealTime = {
    content: "", attachments, sender: {
      name: user.name,
      _id: user._id,
    }, chat: chatId
  }

  const messageForDb = { content: "", attachments, sender: user._id, chat: chatId }

  const message = await Message.create(messageForDb)

  emitEvent(req, NEW_MESSAGE, chat.members, {
    message: messageForRealTime,
    chatId
  })

  emitEvent(req, NEW_MESSAGES_ALERT, chat.members, { chatId })

  return res.status(200).json({ success: true, message })

})

const getChatDetails = async (req, res, next) => {
  try {
    if (req.query.populate === 'true') {

      const chat = await Chat.findById(req.params.id).populate('members', "name avatar").lean();

      if (!chat) {
        return next(new ErrorHandler('Chat not found', 400));
      }

      chat.members = chat.members.map(({ _id, name, avatar }) => ({ _id, name, avatar: avatar.url }))

      return res.status(200).json({ success: true, message: "Fetch group details Successfully", chat })

    }
    else {
      const chat = await Chat.findById(req.params.id);
      if (!chat) {
        return next(new ErrorHandler('Chat not found', 400));
      }
      return res.status(200).json({ success: true, message: "Fetch group details Successfully", chat })
    }
  } catch (error) {
    next(error)
  }
}

const renameGroup = TryCatch(async (req, res, next) => {

  const chat = await Chat.findById(req.params.id);
  const { name } = req.body;

  if (!chat) {
    return next(new ErrorHandler('Chat not found', 404));
  }

  if (!chat.groupChat) {
    return next(new ErrorHandler('This is not a group chat', 400));
  }

  if (chat.creator.toString() !== req.user.toString()) {
    return next(new ErrorHandler('Only the creator can rename the group', 404));
  }

  chat.name = name;

  await chat.save()

  emitEvent(req, REFETCH_CHATS, chat.members)

  return res.status(200).json({ success: true, message: "Group name updated successfully" })

})

const deleteGroup = TryCatch(async (req, res, next) => {

  const chatId = req.params.id;
  console.log(chatId)

  const chat = await Chat.findById(chatId);


  if (!chat) {
    return next(new ErrorHandler('Chat not found', 404));
  }

  const members = chat.members;

  if (chat.groupChat && chat.creator.toString() !== req.user.toString()) {
    return next(new ErrorHandler('Only the creator can delete the group', 404));
  }


  if (chat.groupChat && !chat.members.includes(req.user.toString())) {
    return next(new ErrorHandler('You are not allowed to delete the chat', 404));
  }

  const messageWithAttachments = await Message.find({ chat: chatId, attachments: { $exists: true, $ne: [] } });

  const public_ids = []

  messageWithAttachments.forEach(({ attachments }) => {
    attachments.forEach(({ public_id }) => {
      public_ids.push(public_id)
    })
  })


  await Promise.all([
    deleteFilesFromCloudinary(public_ids),
    Message.deleteMany({ chat: chatId }),
    Chat.deleteOne({ _id: chatId }),
  ]);

  console.log(chat)

  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({ success: true, message: "Chat deleted successfully" })

})

const getMessageDetails = TryCatch(async (req, res, next) => {

  const messageId = req.params.id;

  const { page = 1 } = req.query;
  const chat = await Chat.findById(messageId);

  if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

  if (!chat.members.includes(req.user.toString())) return next(new ErrorHandler("You are not allowed to access this chat", 404));

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  const [message, totalMessagesCount] = await Promise.all([
    Message.find({ chat: messageId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate('sender', "name")
      .lean(),
    Message.countDocuments({ chat: messageId })
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  return res.status(200).json({ success: true, message: "Message details fetched successfully", message: message.reverse(), totalPages })

})

export { addMembers, deleteGroup, getChatDetails, getMessageDetails, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments };
