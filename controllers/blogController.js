const asyncHandler = require("express-async-handler");
const fs = require("fs");
const validateMongoDbId = require("../utils/validateMongoDbId");
const uploadImageOnCloudinary = require("../utils/cloudinary");
const blogRepository = require("../repositories/blogRepository");
const { createActivity } = require("../services/activityService");

const createBlog = asyncHandler(async (req, res) => {
  const newBlog = await blogRepository.create({
    title: req.body.title,
    description: req.body.description || "",
    category: req.body.category || "",
    subcategory: req.body.subcategory || "",
    postedbyuserid: req.user._id,
    images: req.body.images || [],
    author: req.body.author || "Admin",
    ad_type: req.body.adType || req.body.ad_type || "",
    is_active: req.body.isActive !== undefined ? req.body.isActive : true,
    products: req.body.products || [],
    merchant_id: req.body.merchantId || req.body.merchant_id || null,
    store_id: req.body.storeId || req.body.store_id || null,
  });

  createActivity({
    action: "create Blog",
    resource: "Blog",
    resourceId: newBlog._id,
    user: req.user._id,
    details: { newBlog },
  }).catch(() => {});

  res.json(newBlog);
});

const updateBlog = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updateBlog = await blogRepository.updateById(req.params.id, {
    title: req.body.title,
    description: req.body.description ?? "",
    category: req.body.category ?? "",
    subcategory: req.body.subcategory ?? "",
    postedbyuserid: req.user._id,
    images: req.body.images || [],
    author: req.body.author || "Admin",
    ad_type: req.body.adType || req.body.ad_type || "",
    is_active: req.body.isActive,
    products: req.body.products || [],
    merchant_id: req.body.merchantId || req.body.merchant_id || null,
    store_id: req.body.storeId || req.body.store_id || null,
  });

  createActivity({
    action: "Update Blog",
    resource: "Blog",
    resourceId: updateBlog._id,
    user: req.user._id,
    details: { updateBlog },
  }).catch(() => {});

  res.json(updateBlog);
});

const getBlog = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const blog = await blogRepository.findById(req.params.id);
  if (!blog) throw new Error("Blog not found");
  await blogRepository.updateById(req.params.id, { num_views: Number(blog.numViews || 0) + 1 });
  res.json(blog);
});

const getAllBlogs = asyncHandler(async (req, res) => res.json(await blogRepository.findAll()));

const deleteBlog = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedBlog = await blogRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Blog",
    resource: "Blog",
    resourceId: deletedBlog?._id,
    user: req.user._id,
    details: { deletedBlog },
  });
  res.json(deletedBlog);
});

const liketheBlog = asyncHandler(async (req, res) => {
  validateMongoDbId(req.body.blogId);
  const blog = await blogRepository.findById(req.body.blogId);
  const loginUserId = req.user._id;
  const likes = Array.isArray(blog.likes) ? [...blog.likes] : [];
  const dislikes = Array.isArray(blog.dislikes) ? [...blog.dislikes] : [];

  const nextDislikes = dislikes.filter((id) => id !== loginUserId);
  const isLiked = likes.includes(loginUserId);
  const nextLikes = isLiked ? likes.filter((id) => id !== loginUserId) : [...likes, loginUserId];

  res.json(
    await blogRepository.updateById(req.body.blogId, {
      likes: nextLikes,
      dislikes: nextDislikes,
      is_liked: !isLiked,
      is_disliked: false,
    })
  );
});

const disliketheBlog = asyncHandler(async (req, res) => {
  validateMongoDbId(req.body.blogId);
  const blog = await blogRepository.findById(req.body.blogId);
  const loginUserId = req.user._id;
  const likes = Array.isArray(blog.likes) ? [...blog.likes] : [];
  const dislikes = Array.isArray(blog.dislikes) ? [...blog.dislikes] : [];

  const nextLikes = likes.filter((id) => id !== loginUserId);
  const isDisliked = dislikes.includes(loginUserId);
  const nextDislikes = isDisliked ? dislikes.filter((id) => id !== loginUserId) : [...dislikes, loginUserId];

  res.json(
    await blogRepository.updateById(req.body.blogId, {
      likes: nextLikes,
      dislikes: nextDislikes,
      is_liked: false,
      is_disliked: !isDisliked,
    })
  );
});

const uploadImages = asyncHandler(async (req, res) => {
  try {
    const uploader = (path) => uploadImageOnCloudinary(path, "images");
    const urls = [];
    for (const file of req.files) {
      const uploaded = await uploader(file.path);
      urls.push(uploaded);
      try {
        fs.unlinkSync(file.path);
      } catch (err) {}
    }

    res.json(urls.map((file) => ({ public_id: file.public_id, secure_url: file.secure_url })));
  } catch (error) {
    res.status(500).json({ message: "Error uploading images", error });
  }
});

module.exports = { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, liketheBlog, disliketheBlog, uploadImages };
