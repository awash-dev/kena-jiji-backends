const express = require("express");
const {
    createBlog,
    updateBlog,
    getBlog,
    getAllBlogs,
    deleteBlog,
    liketheBlog,
    disliketheBlog,
    uploadImages,
} = require("../controllers/blogController");
const { authMiddleware, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");
//const { blogImgResize, uploadPhoto } = require("../middlewares/uploadImage");
const router = express.Router();

router.post("/", authMiddleware, isSuperAdminOrAdmin, createBlog);
router.put(
    "/upload/:id",
    authMiddleware,
    isSuperAdminOrAdmin,
    //uploadPhoto.array("images", 2),
    //blogImgResize,
    uploadImages
);
router.put("/likes", authMiddleware, liketheBlog);
router.put("/dislikes", authMiddleware, disliketheBlog);

router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updateBlog);

router.get("/:id", getBlog);
router.get("/", getAllBlogs);

router.delete("/:id", authMiddleware, isSuperAdminOrAdmin, deleteBlog);

module.exports = router;