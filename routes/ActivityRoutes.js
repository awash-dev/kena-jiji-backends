// routes/activityRouter.js
const express = require('express');
const { getAdminActivity, getallAdminActivity, getAllActivityByRole,getEachActivity, getAllActivity,updateActivityLog,getUnreadActivity} = require('../controllers/ActivityController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Protect route for authentication and authorization

const router = express.Router();

// Route to get admin activity by adminId
router.get('/admin/:id', getAdminActivity);
router.get("/admin", getallAdminActivity)
router.get("/role/:role", getAllActivityByRole);
router.get("/",getAllActivity)
router.get("/ActivityDetail/:id",getEachActivity)
router.put("/:id",updateActivityLog)
router.get("/unread",getUnreadActivity)

module.exports = router;
