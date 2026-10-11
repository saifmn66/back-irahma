/**
 * tests/helpers/testApp.js
 *
 * Builds the Express app for integration tests using a local MongoDB (mongod
 * already running on localhost:27017) and a dedicated test database so that
 * production / development data is never touched.
 */

const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");

const authRoutes        = require("../../src/routes/auth.routes");
const teacherRoutes     = require("../../src/routes/teacher.routes");
const studentRoutes     = require("../../src/routes/student.routes");
const classRoutes       = require("../../src/routes/class.routes");
const subjectRoutes     = require("../../src/routes/subject.routes");
const classSubjectRoutes= require("../../src/routes/classSubject.routes");
const attendanceRoutes  = require("../../src/routes/attendance.routes");
const timetableRoutes   = require("../../src/routes/timetable.routes");

const TEST_DB_URI = "mongodb://127.0.0.1:27017/irahma_test?directConnection=true";

const os = require("node:os");

let connected = false;

async function connectTestDb() {
  if (!connected) {
    await mongoose.connect(TEST_DB_URI, {
      family: 4,
      runtimeAdapters: { os },
    });
    connected = true;
  }
}



async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  connected = false;
}

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api/auth",           authRoutes);
  app.use("/api/teachers",       teacherRoutes);
  app.use("/api/students",       studentRoutes);
  app.use("/api/classes",        classRoutes);
  app.use("/api/subjects",       subjectRoutes);
  app.use("/api/class-subjects", classSubjectRoutes);
  app.use("/api/attendance",     attendanceRoutes);
  app.use("/api/timetable",      timetableRoutes);

  app.use((req, res) =>
    res.status(404).json({ success: false, message: "Route not found" })
  );

  return app;
}

module.exports = { buildApp, connectTestDb, disconnectTestDb };
