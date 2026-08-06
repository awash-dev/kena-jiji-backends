const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const reportRepository = require("../repositories/reportRepository");
const { createActivity } = require("../services/activityService");

const createReport = asyncHandler(async (req, res) => {
  try {
    const newReport = await reportRepository.create({
      user_id: req.body.user,
      title: req.body.title,
      description: req.body.description,
      issue_type: req.body.issueType,
      priority: req.body.priority,
      email: req.body.email,
      created_by_id: req.body.createdById,
      role: req.body.role,
      status: req.body.status,
    });
    await createActivity({
      action: "create Report",
      resource: "Report on issue",
      resourceId: newReport._id,
      user: newReport.createdById,
      details: { newReport },
    });
    res.json(newReport);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

const updateReport = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedReport = await reportRepository.updateById(req.params.id, {
    user_id: req.body.user,
    title: req.body.title,
    description: req.body.description,
    issue_type: req.body.issueType,
    priority: req.body.priority,
    email: req.body.email,
    created_by_id: req.body.createdById,
    role: req.body.role,
    status: req.body.status,
  });
  await createActivity({
    action: "Update Report",
    resource: "Repoert on issue",
    resourceId: updatedReport._id,
    user: updatedReport.createdById,
    details: { updatedReport },
  });
  res.json(updatedReport);
});

const deleteReport = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedReport = await reportRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Report",
    resource: "Repoert on issue",
    resourceId: deletedReport?._id,
    user: deletedReport?.createdById,
    details: { deletedReport },
  });
  res.json(deletedReport);
});

const getReport = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const report = await reportRepository.findById(req.params.id);
  if (!report) return res.status(404).json({ message: "Report not found" });
  res.json(report);
});

const getAllReports = asyncHandler(async (req, res) => res.json(await reportRepository.findAll()));

const updateReportStatus = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  if (!req.body.status) return res.status(400).json({ message: "Status is required" });
  const updatedReport = await reportRepository.updateById(req.params.id, { status: req.body.status });
  if (!updatedReport) return res.status(404).json({ message: "Report not found" });
  res.json(updatedReport);
});

const toggleFavoriteReport = asyncHandler(async (req, res) => res.json({ message: "Favorite reports are not configured in PostgreSQL migration yet." }));

module.exports = { createReport, updateReport, updateReportStatus, deleteReport, getReport, getAllReports, toggleFavoriteReport };
