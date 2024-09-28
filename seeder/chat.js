import { faker, simpleFaker } from '@faker-js/faker'
import { Chat } from '../models/chatModel.js'
import { Message } from '../models/messageModel.js'
import { User } from '../models/userModel.js'



const createSingleChats = async (numchats) => {
  try {
    const users = await User.find().select("_id");
    const chatPromise = []

    for (let i = 0; i < numchats; i++) {
      for (let j = i + 1; j < numchats; j++) {
        chatPromise.push(
          Chat.create({
            name: faker.lorem.words(2),
            members: [users[i], users[j]]
          })
        )
      }
    }

    await Promise.all(chatPromise)
    console.log("chat created SuccessFully")
    process.exit()
  }
  catch (error) {
    console.log("error")
    process.exit(1)
  }

}

const createGroupChat = async (numsChats) => {
  try {
    const users = await User.find().select("_id");
    const chatPromise = [];

    for (let i = 0; i < numsChats; i++) {
      const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
      const members = []
      for (let j = 0; j < numMembers; j++) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUser = users[randomIndex];

        if (!members.includes(randomUser)) {
          members.push(randomUser);
        }
      }

      const chat = await Chat.create({
        groupChat: true,
        name: faker.lorem.words(2),
        members: members,
        creator: members[0]
      })


    }

    await Promise.all(chatPromise);
    console.log("chats created Successfully")
    process.exit()


  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

const createMessage = async (numsMessage) => {

  try {
    const chats = await Chat.find().select("_id");
    const users = await User.find().select("_id");

    const messagePromise = []

    for (let i = 0; i < numsMessage; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomChat = chats[Math.floor(Math.random() * chats.length)];

      messagePromise.push(Message.create({
        chat: randomChat,
        sender: randomUser,
        content: faker.lorem.sentence()
      }))
    }
    await Promise.all(messagePromise)
    console.log("Message created Successfully")
    process.exit()
  } catch (error) {
    console.log(error)
    process.exit(1)

  }

}

const createMessageInChat = async (chatId, numsMessage) => {
  try {

    const users = await User.find().select("_id");
    const messagePromise = []
    for (let i = 0; i < numsMessage; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      messagePromise.push(Message.create({
        chat: chatId,
        sender: randomUser,
        content: faker.lorem.sentence()
      }))
    }
    await Promise.all(messagePromise)
    console.log("Message created Successfully")
    process.exit()

  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}


export { createGroupChat, createMessage, createMessageInChat, createSingleChats, }