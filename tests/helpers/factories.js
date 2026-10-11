/**
 * tests/helpers/factories.js
 *
 * Tiny factory helpers that create the minimum objects needed for a test,
 * directly via Mongoose (bypassing Express validation noise).
 */

const Teacher      = require("../../src/models/Teacher");
const Student      = require("../../src/models/Student");
const Class        = require("../../src/models/Class");
const Subject      = require("../../src/models/Subject");
const ClassSubject = require("../../src/models/ClassSubject");
const Timetable    = require("../../src/models/Timetable");
const Attendance   = require("../../src/models/Attendance");

let _counter = 0;
const uid = () => ++_counter;

async function makeTeacher(overrides = {}) {
  return Teacher.create({
    firstName:     "Teacher",
    lastName:      `Test${uid()}`,
    teacherNumber: `T${uid()}`,
    password:      "password123",
    specialization:"Mathematics",
    status:        "active",
    ...overrides,
  });
}

async function makeStudent(classId, overrides = {}) {
  return Student.create({
    firstName:     "Student",
    lastName:      `Test${uid()}`,
    studentNumber: `S${uid()}`,
    password:      "password123",
    class:          classId,
    status:        "active",
    ...overrides,
  });
}

async function makeClass(overrides = {}) {
  return Class.create({
    name:         `Class-${uid()}`,
    level:        "9eme",
    academicYear: "2026-2027",
    ...overrides,
  });
}

async function makeSubject(overrides = {}) {
  return Subject.create({
    name: `Subject-${uid()}`,
    code: `SUB${uid()}`,
    ...overrides,
  });
}

async function makeClassSubject(classId, subjectId, teacherId, overrides = {}) {
  return ClassSubject.create({
    class:   classId,
    subject: subjectId,
    teacher: teacherId,
    ...overrides,
  });
}

async function makeTimetable(classId, classSubjectId, overrides = {}) {
  return Timetable.create({
    class:        classId,
    classSubject: classSubjectId,
    day:          "Monday",
    startTime:    "08:00",
    endTime:      "09:00",
    ...overrides,
  });
}

async function makeAttendance(classId, classSubjectId, teacherId, studentIds, overrides = {}) {
  return Attendance.create({
    class:        classId,
    classSubject: classSubjectId,
    teacher:      teacherId,
    date:         "2026-10-07",
    startTime:    "08:00",
    endTime:      "09:00",
    students:     studentIds.map((id) => ({ student: id, status: "present" })),
    ...overrides,
  });
}

module.exports = {
  makeTeacher, makeStudent, makeClass, makeSubject,
  makeClassSubject, makeTimetable, makeAttendance,
};
