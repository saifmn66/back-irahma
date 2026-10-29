
const Subject = require("../models/Subject");

// CREATE SUBJECT
const createSubject = async (req, res) => {
  try {
    const { name, code, description, credits, category, color } = req.body;

    const existingSubject = await Subject.findOne({
      $or: [
        { name: name.trim() },
        ...(code ? [{ code: code.trim().toUpperCase() }] : []),
      ],
    });

    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "A subject with this name or code already exists",
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      ...(code && { code: code.trim().toUpperCase() }),
      ...(description !== undefined && { description }),
      ...(credits !== undefined && { credits: Number(credits) }),
      ...(category !== undefined && { category }),
      ...(color !== undefined && { color }),
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    console.error("Create subject:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL SUBJECTS
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error("Get subjects:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET SUBJECT BY ID
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Get subject:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE SUBJECT
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const newName =
      name !== undefined ? name.trim() : subject.name;

    const newCode =
      code !== undefined
        ? (code.trim() ? code.trim().toUpperCase() : undefined)
        : subject.code;

    const duplicateConditions = [{ name: newName }];

    if (newCode) {
      duplicateConditions.push({ code: newCode });
    }

    const duplicate = await Subject.findOne({
      _id: { $ne: id },
      $or: duplicateConditions,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another subject already uses this name or code",
      });
    }

    if (name !== undefined) subject.name = newName;
    if (code !== undefined) subject.code = newCode;
    if (req.body.description !== undefined) subject.description = req.body.description;
    if (req.body.credits !== undefined) subject.credits = Number(req.body.credits);
    if (req.body.category !== undefined) subject.category = req.body.category;
    if (req.body.color !== undefined) subject.color = req.body.color;

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    console.error("Update subject:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE SUBJECT
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Do not delete a subject referenced by ClassSubject
    const ClassSubject = require("../models/ClassSubject");

    const isAssigned = await ClassSubject.exists({
      subject: subject._id,
    });

    if (isAssigned) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a subject assigned to a class",
      });
    }

    await subject.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete subject:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
