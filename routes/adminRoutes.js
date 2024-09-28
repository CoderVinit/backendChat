import express from "express";
import { adminLogout, allChats, allMessages, allUsers, getAdminData, getDashBoardStats, loginAdmin } from "../controllers/adminController.js";
import { adminLoginValidators, validate } from "../lib/validators.js";
import { adminOnly } from "../middleware/auth.js";

const router = express.Router();


router.post("/varify", adminLoginValidators(), validate, loginAdmin)
router.get("/logout", adminLogout)

router.use(adminOnly)

router.get("/", getAdminData)
router.get("/users", allUsers)
router.get("/chats", allChats)
router.get("/messages", allMessages)
router.get("/stats", getDashBoardStats)





export default router;