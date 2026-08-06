const express = require("express");
const multer = require("multer");
const user_controller = require("../controllers/uploadController");
const router = express.Router();

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./uploads/");
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

let maxSize = 10 * 1024 * 1024; // 10 MB
let upload = multer({
    storage: storage,
    limits: { fileSize: maxSize }
});

router.post("/create", upload.array("multiple_image", 10), user_controller.create);
router.delete("/delete-img/:id", user_controller.deleteImage);

module.exports = router;
