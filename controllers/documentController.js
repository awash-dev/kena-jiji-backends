const cloudinary = require("../utils/cloudinary");
const documentRepository = require("../repositories/documentRepository");
const userRepository = require("../repositories/userRepository");
const { createActivity } = require("../services/activityService");

const createDocument = async (req, res) => {
  try {
    const newDocument = await documentRepository.create({
      tin_number: req.body.TinNumber,
      images: req.body.images,
      id_card_images: req.body.idCardImages,
      postedbyuserid: req.body.PostedByuserId,
    });

    await createActivity({
      action: "Create Document",
      resource: "Document",
      resourceId: newDocument._id,
      user: newDocument.PostedByuserId,
      details: { newDocument },
    });

    res.status(201).json({ success: true, data: newDocument });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating document", error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await documentRepository.findPending();
    if (!documents.length) {
      return res.status(404).json({ success: false, message: "No documents found with status not approved." });
    }
    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const updateDocumentStatus = async (req, res) => {
  try {
    if (!req.body.status) return res.status(400).json({ message: "Status is required." });
    const updatedDocument = await documentRepository.updateById(req.params.id, { status: req.body.status });
    if (!updatedDocument) return res.status(404).json({ message: "Document not found." });
    await createActivity({
      action: "Update Document",
      resource: "Document",
      resourceId: updatedDocument._id,
      user: updatedDocument.PostedByuserId,
      details: { updatedDocument },
    });
    res.status(200).json({ message: "Document status updated successfully.", document: updatedDocument });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

const getMerchantApplications = async (req, res) => {
  try {
    const applications = await documentRepository.findMerchantApplications();
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveMerchantApplication = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userRepository.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await userRepository.updateById(userId, { role: "merchant", is_active: true });
    await documentRepository.updateStatusByUserId(userId, "approved");

    await createActivity({
      action: "Approve Merchant",
      resource: "Merchant Application",
      resourceId: userId,
      user: userId,
      details: { status: "approved" },
    });

    res.status(200).json({ success: true, message: "Merchant application approved." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectMerchantApplication = async (req, res) => {
  try {
    const userId = req.params.id;
    await documentRepository.updateStatusByUserId(userId, "rejected");
    res.status(200).json({ success: true, message: "Merchant application rejected." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit a merchant application from the mobile app.
// Creates a pending row in `documents` (the same source consumed by
// getMerchantApplications) and records the store name/city on the user for display.
const applyMerchant = async (req, res) => {
  try {
    const {
      userId,
      storeName,
      phone,
      tinNumber,
      description,
      category,
      city,
      documentUrl,
      status,
    } = req.body;

    const uid = userId || req.user?._id;
    if (!uid) return res.status(400).json({ success: false, message: "userId is required" });

    const user = await userRepository.findById(uid);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const newDocument = await documentRepository.create({
      tin_number: tinNumber || "",
      images: documentUrl ? [{ secure_url: documentUrl }] : [],
      id_card_images: [],
      status: status || "pending",
      postedbyuserid: uid,
    });

    // Keep the store name & city visible in the admin applications list.
    await userRepository.updateById(uid, {
      username: storeName || user.username,
      address: city || user.address,
    });

    await createActivity({
      action: "Apply Merchant",
      resource: "Merchant Application",
      resourceId: newDocument._id,
      user: uid,
      details: { storeName, phone, category, city, description },
    });

    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("merchant applied", {
        userId: uid,
        storeName,
        phone,
        category,
        city,
        documentId: newDocument._id,
      });
      io.to("admins").emit("notification", {
        title: "New Merchant Application",
        message: `${storeName || user.firstname || "A user"} applied for merchant approval.`,
        type: "merchant_application",
      });
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: newDocument,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "documents" });
      uploadedImages.push({ public_id: result.public_id, secure_url: result.secure_url });
    }
    res.status(200).json({ success: true, payload: uploadedImages });
  } catch (error) {
    res.status(400).json({ success: false, message: "Image upload failed", error: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.id);
    if (result.result !== "ok") throw new Error("Failed to delete image");
    res.status(200).json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Image deletion failed", error: error.message });
  }
};

module.exports = {
  createDocument,
  uploadImage,
  deleteImage,
  getDocuments,
  updateDocumentStatus,
  getMerchantApplications,
  approveMerchantApplication,
  rejectMerchantApplication,
  applyMerchant,
};
