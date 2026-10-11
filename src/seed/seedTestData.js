/**
 * seedTestData.js — Irahma School realistic test-data generator
 *
 * Usage:
 *   node src/seed/seedTestData.js            # create data
 *   node src/seed/seedTestData.js --clean    # delete ONLY seeded records
 *
 * The script is idempotent: running it twice does not create duplicates.
 * It uses the prefix "SEED-" on all teacherNumber / studentNumber values
 * so that cleanup never touches real data.
 */

require("dotenv").config();

const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");

const Teacher     = require("../models/Teacher");
const Student     = require("../models/Student");
const Class       = require("../models/Class");
const Subject     = require("../models/Subject");
const ClassSubject= require("../models/ClassSubject");
const Timetable   = require("../models/Timetable");
const Attendance  = require("../models/Attendance");

// ─── Prefix that marks every seeded record ────────────────────────────────────
const SEED_PREFIX = "SEED-";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const log  = (msg) => console.log(`[SEED] ${msg}`);
const warn = (msg) => console.warn(`[SEED] ⚠  ${msg}`);

async function upsertTeacher(data) {
  const existing = await Teacher.findOne({ teacherNumber: data.teacherNumber });
  if (existing) { log(`Teacher already exists: ${data.teacherNumber}`); return existing; }
  const t = await Teacher.create(data);
  log(`Created teacher: ${t.teacherNumber} (${t.firstName} ${t.lastName})`);
  return t;
}

async function upsertStudent(data) {
  const existing = await Student.findOne({ studentNumber: data.studentNumber });
  if (existing) { log(`Student already exists: ${data.studentNumber}`); return existing; }
  const s = await Student.create(data);
  log(`Created student: ${s.studentNumber} (${s.firstName} ${s.lastName})`);
  return s;
}

async function upsertClass(data) {
  const existing = await Class.findOne({ name: data.name, academicYear: data.academicYear });
  if (existing) { log(`Class already exists: ${data.name}`); return existing; }
  const c = await Class.create(data);
  log(`Created class: ${c.name}`);
  return c;
}

async function upsertSubject(data) {
  const existing = await Subject.findOne({ code: data.code });
  if (existing) { log(`Subject already exists: ${data.code}`); return existing; }
  const s = await Subject.create(data);
  log(`Created subject: ${s.code}`);
  return s;
}

async function upsertClassSubject(data) {
  const existing = await ClassSubject.findOne({ class: data.class, subject: data.subject });
  if (existing) { log(`ClassSubject already exists`); return existing; }
  const cs = await ClassSubject.create(data);
  log(`Created ClassSubject (class=${cs.class}, subject=${cs.subject})`);
  return cs;
}

async function upsertTimetable(data) {
  const existing = await Timetable.findOne({
    class: data.class, classSubject: data.classSubject,
    day: data.day, startTime: data.startTime,
  });
  if (existing) { log(`Timetable slot already exists`); return existing; }
  const tt = await Timetable.create(data);
  log(`Created timetable: ${data.day} ${data.startTime}-${data.endTime}`);
  return tt;
}

async function upsertAttendance(data) {
  const existing = await Attendance.findOne({
    classSubject: data.classSubject,
    date: new Date(data.date),
    startTime: data.startTime,
  });
  if (existing) { log(`Attendance record already exists`); return existing; }
  const att = await Attendance.create(data);
  log(`Created attendance: ${data.date} ${data.startTime}`);
  return att;
}

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  log("Connecting to MongoDB …");
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  log("Connected.");

  // ── 1. Teachers ─────────────────────────────────────────────────────────────
  const teacher1 = await upsertTeacher({
    firstName: "Ahmed",    lastName: "Brahim",
    teacherNumber: `${SEED_PREFIX}T001`,
    password: `${SEED_PREFIX}T001`,      // hashed by pre-save hook
    email: "seed.ahmed.brahim@irahma.edu",
    specialization: "Mathematics",
    gender: "male", status: "active",
  });

  const teacher2 = await upsertTeacher({
    firstName: "Fatma",   lastName: "Mansour",
    teacherNumber: `${SEED_PREFIX}T002`,
    password: `${SEED_PREFIX}T002`,
    email: "seed.fatma.mansour@irahma.edu",
    specialization: "French",
    gender: "female", status: "active",
  });

  const teacher3 = await upsertTeacher({
    firstName: "Karim",   lastName: "Chérif",
    teacherNumber: `${SEED_PREFIX}T003`,
    password: `${SEED_PREFIX}T003`,
    email: "seed.karim.cherif@irahma.edu",
    specialization: "Physics",
    gender: "male", status: "active",
  });

  const teacher4 = await upsertTeacher({
    firstName: "Leila",   lastName: "Saidi",
    teacherNumber: `${SEED_PREFIX}T004`,
    password: `${SEED_PREFIX}T004`,
    email: "seed.leila.saidi@irahma.edu",
    specialization: "English",
    gender: "female", status: "active",
  });

  // ── 2. Classes ───────────────────────────────────────────────────────────────
  const classA = await upsertClass({
    name: "9eme-A", level: "9eme", academicYear: "2026-2027", capacity: 30,
  });

  const classB = await upsertClass({
    name: "8eme-B", level: "8eme", academicYear: "2026-2027", capacity: 28,
  });

  // ── 3. Students ──────────────────────────────────────────────────────────────
  const studentsA = [];
  const studentsB = [];

  const studentsAData = [
    { firstName: "Yassine", lastName: "Ben Ali",   studentNumber: `${SEED_PREFIX}S001`, gender: "male"   },
    { firstName: "Nour",    lastName: "Trabelsi",  studentNumber: `${SEED_PREFIX}S002`, gender: "female" },
    { firstName: "Omar",    lastName: "Khedri",    studentNumber: `${SEED_PREFIX}S003`, gender: "male"   },
    { firstName: "Amira",   lastName: "Gafsi",     studentNumber: `${SEED_PREFIX}S004`, gender: "female" },
    { firstName: "Mourad",  lastName: "Hamdi",     studentNumber: `${SEED_PREFIX}S005`, gender: "male"   },
    { firstName: "Sana",    lastName: "Dridi",     studentNumber: `${SEED_PREFIX}S006`, gender: "female" },
  ];

  for (const d of studentsAData) {
    const s = await upsertStudent({
      ...d, password: d.studentNumber, class: classA._id, status: "active",
    });
    studentsA.push(s);
  }

  const studentsBData = [
    { firstName: "Rami",    lastName: "Gharsalli", studentNumber: `${SEED_PREFIX}S007`, gender: "male"   },
    { firstName: "Selma",   lastName: "Ouali",     studentNumber: `${SEED_PREFIX}S008`, gender: "female" },
    { firstName: "Mehdi",   lastName: "Bouzid",    studentNumber: `${SEED_PREFIX}S009`, gender: "male"   },
    { firstName: "Ines",    lastName: "Amdouni",   studentNumber: `${SEED_PREFIX}S010`, gender: "female" },
    { firstName: "Amine",   lastName: "Mejri",     studentNumber: `${SEED_PREFIX}S011`, gender: "male"   },
    { firstName: "Hajer",   lastName: "Slim",      studentNumber: `${SEED_PREFIX}S012`, gender: "female" },
  ];

  for (const d of studentsBData) {
    const s = await upsertStudent({
      ...d, password: d.studentNumber, class: classB._id, status: "active",
    });
    studentsB.push(s);
  }

  // Add students to Class.students array
  const allIdsA = studentsA.map((s) => s._id.toString());
  const allIdsB = studentsB.map((s) => s._id.toString());

  const existingIdsA = (classA.students || []).map((id) => id.toString());
  const existingIdsB = (classB.students || []).map((id) => id.toString());

  const newForA = allIdsA.filter((id) => !existingIdsA.includes(id));
  const newForB = allIdsB.filter((id) => !existingIdsB.includes(id));

  if (newForA.length) {
    await Class.findByIdAndUpdate(classA._id, { $push: { students: { $each: newForA } } });
    log(`Added ${newForA.length} students to ${classA.name}`);
  }
  if (newForB.length) {
    await Class.findByIdAndUpdate(classB._id, { $push: { students: { $each: newForB } } });
    log(`Added ${newForB.length} students to ${classB.name}`);
  }

  // ── 4. Subjects ──────────────────────────────────────────────────────────────
  const subjectMath    = await upsertSubject({ name: "Mathematics", code: "SEED-MATH" });
  const subjectFrench  = await upsertSubject({ name: "French",      code: "SEED-FRA"  });
  const subjectEnglish = await upsertSubject({ name: "English",     code: "SEED-ENG"  });
  const subjectPhysics = await upsertSubject({ name: "Physics",     code: "SEED-PHY"  });

  // ── 5. ClassSubjects ─────────────────────────────────────────────────────────
  const csA_Math    = await upsertClassSubject({ class: classA._id, subject: subjectMath._id,    teacher: teacher1._id, coefficient: 4 });
  const csA_French  = await upsertClassSubject({ class: classA._id, subject: subjectFrench._id,  teacher: teacher2._id, coefficient: 3 });
  const csA_English = await upsertClassSubject({ class: classA._id, subject: subjectEnglish._id, teacher: teacher4._id, coefficient: 3 });
  const csA_Physics = await upsertClassSubject({ class: classA._id, subject: subjectPhysics._id, teacher: teacher3._id, coefficient: 3 });

  const csB_Math    = await upsertClassSubject({ class: classB._id, subject: subjectMath._id,    teacher: teacher1._id, coefficient: 4 });
  const csB_French  = await upsertClassSubject({ class: classB._id, subject: subjectFrench._id,  teacher: teacher2._id, coefficient: 3 });
  const csB_English = await upsertClassSubject({ class: classB._id, subject: subjectEnglish._id, teacher: teacher4._id, coefficient: 3 });

  // ── 6. Timetable ─────────────────────────────────────────────────────────────
  // Class A — Monday
  const ttA1 = await upsertTimetable({ class: classA._id, classSubject: csA_Math._id,    day: "Monday",    startTime: "08:00", endTime: "09:00", room: "Room-101" });
  const ttA2 = await upsertTimetable({ class: classA._id, classSubject: csA_French._id,  day: "Monday",    startTime: "09:00", endTime: "10:00", room: "Room-101" });
  const ttA3 = await upsertTimetable({ class: classA._id, classSubject: csA_English._id, day: "Monday",    startTime: "10:30", endTime: "11:30", room: "Room-101" });
  const ttA4 = await upsertTimetable({ class: classA._id, classSubject: csA_Physics._id, day: "Tuesday",   startTime: "08:00", endTime: "09:30", room: "Room-Lab" });
  const ttA5 = await upsertTimetable({ class: classA._id, classSubject: csA_Math._id,    day: "Wednesday", startTime: "08:00", endTime: "09:00", room: "Room-101" });
  const ttA6 = await upsertTimetable({ class: classA._id, classSubject: csA_French._id,  day: "Thursday",  startTime: "10:00", endTime: "11:00", room: "Room-201" });
  const ttA7 = await upsertTimetable({ class: classA._id, classSubject: csA_English._id, day: "Saturday",  startTime: "08:30", endTime: "09:30", room: "Room-201" });

  // Class B — different rooms / non-overlapping teachers
  const ttB1 = await upsertTimetable({ class: classB._id, classSubject: csB_Math._id,    day: "Monday",    startTime: "09:00", endTime: "10:00", room: "Room-102" });
  const ttB2 = await upsertTimetable({ class: classB._id, classSubject: csB_French._id,  day: "Tuesday",   startTime: "09:30", endTime: "10:30", room: "Room-102" });
  const ttB3 = await upsertTimetable({ class: classB._id, classSubject: csB_English._id, day: "Wednesday", startTime: "09:30", endTime: "10:30", room: "Room-102" });

  // ── 7. Attendance ────────────────────────────────────────────────────────────
  const attendDate = "2026-10-07";

  const att1 = await upsertAttendance({
    class:        classA._id,
    classSubject: csA_Math._id,
    teacher:      teacher1._id,
    date:         attendDate,
    startTime:    "08:00",
    endTime:      "09:00",
    students: [
      { student: studentsA[0]._id, status: "present" },
      { student: studentsA[1]._id, status: "present" },
      { student: studentsA[2]._id, status: "absent"  },
      { student: studentsA[3]._id, status: "late",   note: "Arrived 10 minutes late" },
      { student: studentsA[4]._id, status: "excused", note: "Medical certificate" },
      { student: studentsA[5]._id, status: "present" },
    ],
  });

  const att2 = await upsertAttendance({
    class:        classA._id,
    classSubject: csA_French._id,
    teacher:      teacher2._id,
    date:         attendDate,
    startTime:    "09:00",
    endTime:      "10:00",
    students: [
      { student: studentsA[0]._id, status: "present" },
      { student: studentsA[1]._id, status: "absent"  },
      { student: studentsA[2]._id, status: "present" },
      { student: studentsA[3]._id, status: "present" },
      { student: studentsA[4]._id, status: "excused", note: "Medical certificate" },
      { student: studentsA[5]._id, status: "late"    },
    ],
  });

  const att3 = await upsertAttendance({
    class:        classB._id,
    classSubject: csB_Math._id,
    teacher:      teacher1._id,
    date:         "2026-10-06",
    startTime:    "09:00",
    endTime:      "10:00",
    students: [
      { student: studentsB[0]._id, status: "present" },
      { student: studentsB[1]._id, status: "present" },
      { student: studentsB[2]._id, status: "absent"  },
      { student: studentsB[3]._id, status: "present" },
      { student: studentsB[4]._id, status: "present" },
      { student: studentsB[5]._id, status: "late"    },
    ],
  });

  // ── 8. Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════ SEEDED IDs ═══════════════════════════");
  console.log("TEACHERS");
  console.log(`  teacher1 (Math)    : ${teacher1._id}   [${teacher1.teacherNumber}]`);
  console.log(`  teacher2 (French)  : ${teacher2._id}   [${teacher2.teacherNumber}]`);
  console.log(`  teacher3 (Physics) : ${teacher3._id}   [${teacher3.teacherNumber}]`);
  console.log(`  teacher4 (English) : ${teacher4._id}   [${teacher4.teacherNumber}]`);
  console.log("\nCLASSES");
  console.log(`  classA (9eme-A)    : ${classA._id}`);
  console.log(`  classB (8eme-B)    : ${classB._id}`);
  console.log("\nSUBJECTS");
  console.log(`  Math               : ${subjectMath._id}`);
  console.log(`  French             : ${subjectFrench._id}`);
  console.log(`  English            : ${subjectEnglish._id}`);
  console.log(`  Physics            : ${subjectPhysics._id}`);
  console.log("\nCLASS-SUBJECTS (classA)");
  console.log(`  csA_Math           : ${csA_Math._id}`);
  console.log(`  csA_French         : ${csA_French._id}`);
  console.log(`  csA_English        : ${csA_English._id}`);
  console.log(`  csA_Physics        : ${csA_Physics._id}`);
  console.log("\nCLASS-SUBJECTS (classB)");
  console.log(`  csB_Math           : ${csB_Math._id}`);
  console.log(`  csB_French         : ${csB_French._id}`);
  console.log(`  csB_English        : ${csB_English._id}`);
  console.log("\nSTUDENTS (classA)");
  studentsA.forEach((s) => console.log(`  ${s.studentNumber}: ${s._id}`));
  console.log("\nSTUDENTS (classB)");
  studentsB.forEach((s) => console.log(`  ${s.studentNumber}: ${s._id}`));
  console.log("\nTIMETABLE");
  [ttA1,ttA2,ttA3,ttA4,ttA5,ttA6,ttA7,ttB1,ttB2,ttB3].forEach((t) =>
    console.log(`  ${t._id} — ${t.day} ${t.startTime}-${t.endTime}`)
  );
  console.log("\nATTENDANCE");
  [att1, att2, att3].forEach((a) =>
    console.log(`  ${a._id} — ${a.date.toISOString().slice(0,10)} ${a.startTime}`)
  );
  console.log("══════════════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  log("Done. MongoDB disconnected.");
}

// ─── Clean function ───────────────────────────────────────────────────────────
async function clean() {
  log("Connecting to MongoDB …");
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  log("Connected. Removing seeded records …");

  // Find seeded teachers / students by number prefix
  const seededTeachers = await Teacher.find({ teacherNumber: { $regex: `^${SEED_PREFIX}` } });
  const seededStudents = await Student.find({ studentNumber: { $regex: `^${SEED_PREFIX}` } });
  const teacherIds     = seededTeachers.map((t) => t._id);
  const studentIds     = seededStudents.map((s) => s._id);

  // Subjects by code prefix
  const seededSubjects = await Subject.find({ code: { $regex: `^${SEED_PREFIX}` } });
  const subjectIds     = seededSubjects.map((s) => s._id);

  // ClassSubjects that reference seeded teachers or subjects
  const seededCSs = await ClassSubject.find({
    $or: [{ teacher: { $in: teacherIds } }, { subject: { $in: subjectIds } }],
  });
  const csIds = seededCSs.map((cs) => cs._id);

  // Timetable referencing those ClassSubjects
  const timetableDel = await Timetable.deleteMany({ classSubject: { $in: csIds } });
  log(`Deleted ${timetableDel.deletedCount} timetable entries`);

  // Attendance referencing those ClassSubjects or teachers
  const attendanceDel = await Attendance.deleteMany({
    $or: [{ classSubject: { $in: csIds } }, { teacher: { $in: teacherIds } }],
  });
  log(`Deleted ${attendanceDel.deletedCount} attendance records`);

  await ClassSubject.deleteMany({ _id: { $in: csIds } });
  log(`Deleted ${csIds.length} ClassSubject records`);

  // Classes that only contained seeded students
  const seedStudentSet = new Set(studentIds.map(String));
  const candidateClasses = await Class.find({});
  for (const cls of candidateClasses) {
    const allStudentsSeeded = cls.students.every((id) => seedStudentSet.has(String(id)));
    if (allStudentsSeeded && cls.students.length > 0) {
      await Class.findByIdAndDelete(cls._id);
      log(`Deleted class: ${cls.name}`);
    }
  }

  await Student.deleteMany({ _id: { $in: studentIds } });
  log(`Deleted ${studentIds.length} students`);

  await Teacher.deleteMany({ _id: { $in: teacherIds } });
  log(`Deleted ${teacherIds.length} teachers`);

  await Subject.deleteMany({ _id: { $in: subjectIds } });
  log(`Deleted ${subjectIds.length} subjects`);

  await mongoose.disconnect();
  log("Clean complete. MongoDB disconnected.");
}

// ─── Entry point ─────────────────────────────────────────────────────────────
const isClean = process.argv.includes("--clean");

(isClean ? clean() : seed()).catch((err) => {
  console.error("[SEED] Fatal error:", err.message);
  process.exit(1);
});
