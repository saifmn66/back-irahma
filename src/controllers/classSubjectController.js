
const ClassSubject = require("../models/ClassSubject");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

// Helper: populate references
const populateClassSubject = (query) =>
  query.populate("class").populate("subject").populate("teacher");

// CREATE
const createClassSubject = async (req, res) => {
  try {
    const { class: classId, subject, teacher, coefficient } = req.body;

    const [existingClass, existingSubject, existingTeacher] =
      await Promise.all([
        Class.findById(classId),
        Subject.findById(subject),
        Teacher.findById(teacher),
      ]);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const duplicate = await ClassSubject.findOne({
      class: classId,
      subject,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This subject is already assigned to this class",
      });
    }

    const classSubject = await ClassSubject.create({
      class: classId,
      subject,
      teacher,
      ...(coefficient !== undefined && {
        coefficient: Number(coefficient),
      }),
    });

    const data = await populateClassSubject(
      ClassSubject.findById(classSubject._id)
    );

    return res.status(201).json({
      success: true,
      message: "Class subject created successfully",
      data,
    });
  } catch (error) {
    console.error("Create class subject:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL
const getAllClassSubjects = async (req, res) => {
  try {
    const data = await populateClassSubject(
      ClassSubject.find()
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get class subjects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET BY ID
const getClassSubjectById = async (req, res) => {
  try {
    const data = await populateClassSubject(
      ClassSubject.findById(req.params.id)
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Class subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get class subject:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET SUBJECTS BY CLASS
const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const existingClass = await Class.findById(classId);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const data = await populateClassSubject(
      ClassSubject.find({ class: classId })
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get subjects by class:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ASSIGNMENTS BY TEACHER
const getClassesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const existingTeacher = await Teacher.findById(teacherId);

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const data = await populateClassSubject(
      ClassSubject.find({ teacher: teacherId })
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get assignments by teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE
const updateClassSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { class: classId, subject, teacher, coefficient } = req.body;

    const classSubject = await ClassSubject.findById(id);

    if (!classSubject) {
      return res.status(404).json({
        success: false,
        message: "Class subject not found",
      });
    }

    const newClassId = classId ?? classSubject.class;
    const newSubjectId = subject ?? classSubject.subject;

    // Check updated references
    const checks = [];

    if (classId !== undefined) {
      checks.push(
        Class.findById(classId).then((doc) => ({
          name: "Class",
          doc,
        }))
      );
    }

    if (subject !== undefined) {
      checks.push(
        Subject.findById(subject).then((doc) => ({
          name: "Subject",
          doc,
        }))
      );
    }

    if (teacher !== undefined) {
      checks.push(
        Teacher.findById(teacher).then((doc) => ({
          name: "Teacher",
          doc,
        }))
      );
    }

    const results = await Promise.all(checks);
    const missing = results.find((result) => !result.doc);

    if (missing) {
      return res.status(404).json({
        success: false,
        message: `${missing.name} not found`,
      });
    }

    // Prevent duplicate class + subject pairs
    const duplicate = await ClassSubject.findOne({
      _id: { $ne: id },
      class: newClassId,
      subject: newSubjectId,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This subject is already assigned to this class",
      });
    }

    if (classId !== undefined) classSubject.class = classId;
    if (subject !== undefined) classSubject.subject = subject;
    if (teacher !== undefined) classSubject.teacher = teacher;

    if (coefficient !== undefined) {
      classSubject.coefficient = Number(coefficient);
    }

    await classSubject.save();

    const data = await populateClassSubject(
      ClassSubject.findById(id)
    );

    return res.status(200).json({
      success: true,
      message: "Class subject updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update class subject:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE
const deleteClassSubject = async (req, res) => {
  try {
    const data = await ClassSubject.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Class subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Class subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete class subject:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createClassSubject,
  getAllClassSubjects,
  getClassSubjectById,
  getSubjectsByClass,
  getClassesByTeacher,
  updateClassSubject,
  deleteClassSubject,
};
