import express from "express";
import { addMembers, deleteGroup, getChatDetails, getMessageDetails, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments } from "../controllers/chatController.js";
import { addMembersValidators, chatIdValidators, leaveGroupValidators, newGroupChatValidators, removeMemberValidators, renameGroupValidators, sendAttachmentsValidators, validate } from "../lib/validators.js";
import { isAuthenticated } from "../middleware/auth.js";
import { attachments as attachmentsMulter } from "../middleware/multer.js";


const router = express.Router();


router.use(isAuthenticated)


router.post("/new", newGroupChatValidators(), validate, newGroupChat)
router.get("/my", getMyChats)
router.get("/my/groups", getMyGroups)
router.put("/addmembers", addMembersValidators(), validate, addMembers)
router.put("/removemembers", removeMemberValidators(), validate, removeMember)
router.delete("/leave/:id", leaveGroupValidators(), validate, leaveGroup)


// Attachments
router.post("/message", attachmentsMulter, sendAttachmentsValidators(), validate, sendAttachments)

//get Messages
router.get("/message/:id", chatIdValidators(), validate, getMessageDetails)
//get chat details,rename,delete

router.route("/:id").get(chatIdValidators(), validate, getChatDetails).put(renameGroupValidators(), validate, renameGroup).delete(chatIdValidators(), validate, deleteGroup)




export default router;