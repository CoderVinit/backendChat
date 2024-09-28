import express from "express";
import { acceptFriendRequest, getMyFriends, getMyNotifications, getMyProfile, login, logout, newUser, searchUser, sendFriendRequest } from "../controllers/userController.js";
import { acceptRequestValidators, loginValidators, registerValidators, sendRequestValidators, validate } from "../lib/validators.js";
import { isAuthenticated } from "../middleware/auth.js";
import { singleAvatar } from "../middleware/multer.js";


const router = express.Router();



router.post('/new', singleAvatar, registerValidators(), validate, newUser)
router.post("/login", loginValidators(), validate, login);


router.use(isAuthenticated)

router.get('/me', getMyProfile)
router.get('/logout', logout)
router.get('/search', searchUser)
router.put('/sendrequest', sendRequestValidators(), validate, sendFriendRequest)
router.put('/acceptrequest', acceptRequestValidators(), validate, acceptFriendRequest)
router.get("/notifications", getMyNotifications)
router.get("/getfriends", getMyFriends)





export default router;