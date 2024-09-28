import multer from "multer";


const multerUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5 // Maximum file size is  5MB
  }
})

const singleAvatar = multerUpload.single("avatar");
const attachments = multerUpload.array("files", 5);


export { singleAvatar, attachments };