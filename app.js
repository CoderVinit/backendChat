import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorMiddleware } from "./middleware/error.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { connectDb } from "./utils/features.js";
import { Server } from 'socket.io'
import { createServer } from 'http'
import { NEW_MESSAGE, NEW_MESSAGES_ALERT, START_TYPING, STOP_TYPING } from "./constants/events.js";
import { v4 as uuid } from 'uuid'
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/messageModel.js";
import { v2 as cloudinary } from "cloudinary";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middleware/auth.js";



dotenv.config({
  path: "./.env"
})

const envMode = process.env.NODE_ENV.trim() || "PRODUCTION"


connectDb(process.env.DB_URI)
// createSingleChats(5)
// createMessage(5)
// createMessageInChat("65f0941d832d4019b5d8ee44", 10)
// createGroupChat(5)

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


const app = express();
const server = createServer(app)
const io = new Server(server, {
  cors: corsOptions
})

app.set("io", io)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const adminSecretKey = process.env.ADMIN_SECRET_KEY || "dadjasgdugwufeJKdf"
const userSocketIDs = new Map()

app.use(cors(corsOptions))

app.use("/api/v1/users", userRoutes)
app.use("/api/v1/chats", chatRoutes)
app.use("/api/v1/admin", adminRoutes)


app.get("/", (req, res) => {
  res.send("Hello World");
});

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => await socketAuthenticator(err, socket, next))
})

io.on('connection', (socket) => {

  const user = socket.user;
  // console.log(user)
  userSocketIDs.set(user._id.toString(), socket.id)

  // console.log(userSocketIDs)

  socket.on(NEW_MESSAGE, async ({ members, chatId, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name
      },
      chat: chatId,
      createdAt: new Date().toISOString()
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    }


    const membersSocket = getSockets(members)
    io.to(membersSocket).emit(NEW_MESSAGE, { chatId, message: messageForRealTime })
    io.to(membersSocket).emit(NEW_MESSAGES_ALERT, { chatId })

    try {
      await Message.create(messageForDB)
    } catch (error) {
      console.log(error)
    }
  })

  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId });
  })

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  })

  socket.on('disconnect', () => {
    userSocketIDs.delete(user._id.toString())
  })

})

const port = process.env.PORT || 6000


app.use(errorMiddleware)

server.listen(port, () => {
  console.log(`Server is running on port ${port} in ${envMode} Mode`)
});



export { adminSecretKey, envMode, userSocketIDs };
