/**
 * tests/attendance.test.js
 *
 * Full integration tests for the Attendance API.
 * Covers all 12 requirements listed in the task brief.
 *
 * Run: npx jest tests/attendance.test.js --runInBand
 */

const request  = require("supertest");
const { buildApp, connectTestDb, disconnectTestDb } = require("./helpers/testApp");
const {
  makeTeacher, makeStudent, makeClass, makeSubject,
  makeClassSubject, makeAttendance,
} = require("./helpers/factories");

let app;
let teacher1, teacher2;
let classA, classB;
let subject1;
let csA1, csA2;
let csB1;
let studentsA;   // 6 students in classA
let studentsB;   // students in classB

// Helper: build a POST body for createAttendance
const attBody = (overrides = {}) => ({
  class:        classA._id.toString(),
  classSubject: csA1._id.toString(),
  teacher:      teacher1._id.toString(),
  date:         "2026-11-01",
  startTime:    "08:00",
  endTime:      "09:00",
  students: studentsA.slice(0, 3).map((s) => ({
    student: s._id.toString(), status: "present",
  })),
  ...overrides,
});

beforeAll(async () => {
  await connectTestDb();
  app = buildApp();

  teacher1 = await makeTeacher({ firstName: "Prof1" });
  teacher2 = await makeTeacher({ firstName: "Prof2" });
  classA   = await makeClass({ name: "ATT-ClassA" });
  classB   = await makeClass({ name: "ATT-ClassB" });
  subject1 = await makeSubject({ name: "Math-ATT", code: "ATT-MATH" });

  csA1 = await makeClassSubject(classA._id, subject1._id, teacher1._id);
  csA2 = await makeClassSubject(classA._id, (await makeSubject({ code: "ATT-PHYS" }))._id, teacher2._id);
  csB1 = await makeClassSubject(classB._id, subject1._id, teacher2._id);

  studentsA = [];
  for (let i = 0; i < 6; i++) {
    studentsA.push(await makeStudent(classA._id));
  }

  studentsB = [];
  for (let i = 0; i < 3; i++) {
    studentsB.push(await makeStudent(classB._id));
  }
});

afterAll(disconnectTestDb);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Valid creation succeeds
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — valid creation", () => {
  test("201 with all statuses: present, absent, late, excused", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        date: "2026-11-02",
        students: [
          { student: studentsA[0]._id.toString(), status: "present" },
          { student: studentsA[1]._id.toString(), status: "absent"  },
          { student: studentsA[2]._id.toString(), status: "late",    note: "10 min late" },
          { student: studentsA[3]._id.toString(), status: "excused", note: "sick"        },
        ],
      })
    );
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const statuses = res.body.data.students.map((s) => s.status);
    expect(statuses).toContain("present");
    expect(statuses).toContain("absent");
    expect(statuses).toContain("late");
    expect(statuses).toContain("excused");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2 & 3. ClassSubject must belong to the class and the teacher
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — class / classSubject / teacher relationship", () => {
  test("400 when classSubject belongs to a different class", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        date: "2026-11-03",
        classSubject: csB1._id.toString(), // csB1 is for classB, not classA
      })
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not match/i);
  });

  test("400 when teacher does not match classSubject.teacher", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        date: "2026-11-04",
        classSubject: csA2._id.toString(), // csA2 is teacher2's, not teacher1's
        teacher: teacher1._id.toString(),
      })
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not match/i);
  });

  test("200 when all three are consistent", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ date: "2026-11-05" })
    );
    expect(res.status).toBe(201);
    expect(res.body.data.class).toBeDefined();
    expect(res.body.data.classSubject).toBeDefined();
    expect(res.body.data.teacher).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Students must belong to the class
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — students must belong to the class", () => {
  test("400 when a student belongs to a different class", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        date: "2026-11-06",
        students: [
          { student: studentsB[0]._id.toString(), status: "present" }, // classB student!
        ],
      })
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not belong/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Duplicate students in one record are rejected
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — no duplicate students", () => {
  test("400 when the same student appears twice", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        date: "2026-11-07",
        students: [
          { student: studentsA[0]._id.toString(), status: "present" },
          { student: studentsA[0]._id.toString(), status: "absent"  }, // duplicate
        ],
      })
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/more than once/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Only allowed statuses are accepted
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — status enum validation", () => {
  test("400 for invalid status value", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        date: "2026-11-08",
        students: [
          { student: studentsA[0]._id.toString(), status: "skipped" },
        ],
      })
    );
    expect(res.status).toBe(400);
  });

  test("201 for all valid statuses", async () => {
    const validStatuses = ["present", "absent", "late", "excused"];
    for (let idx = 0; idx < validStatuses.length; idx++) {
      const status = validStatuses[idx];
      const res = await request(app).post("/api/attendance").send(
        attBody({
          date: `2026-11-1${idx}`,
          startTime: `0${idx + 5}:00`,
          endTime:   `0${idx + 6}:00`,
          students: [{ student: studentsA[0]._id.toString(), status }],
        })
      );
      expect(res.status).toBe(201);
    }
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Missing required fields and invalid IDs are rejected
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — required field validation", () => {
  test("400 for empty body", async () => {
    const res = await request(app).post("/api/attendance").send({});
    expect(res.status).toBe(400);
  });

  test("400 for invalid class MongoID", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ class: "bad-id" })
    );
    expect(res.status).toBe(400);
  });

  test("400 for invalid teacher MongoID", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ teacher: "bad-id" })
    );
    expect(res.status).toBe(400);
  });

  test("400 for invalid student MongoID in students array", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({
        students: [{ student: "bad-id", status: "present" }],
      })
    );
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Invalid dates and time ranges are rejected
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — date and time validation", () => {
  test("400 for invalid date format", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ date: "not-a-date" })
    );
    expect(res.status).toBe(400);
  });

  test("400 when endTime equals startTime", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ startTime: "09:00", endTime: "09:00" })
    );
    expect(res.status).toBe(400);
  });

  test("400 when endTime is before startTime", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ startTime: "11:00", endTime: "09:00" })
    );
    expect(res.status).toBe(400);
  });

  test("400 for malformed time (wrong format)", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ startTime: "8:00" })
    );
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Duplicate session check (same classSubject + date + startTime)
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/attendance — duplicate session prevention", () => {
  const DUP_DATE  = "2026-11-20";
  const DUP_START = "08:00";

  beforeAll(async () => {
    await makeAttendance(
      classA._id, csA1._id, teacher1._id,
      [studentsA[0]._id],
      { date: DUP_DATE, startTime: DUP_START, endTime: "09:00" }
    );
  });

  test("409 for duplicate classSubject + date + startTime", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ date: DUP_DATE, startTime: DUP_START, endTime: "09:00" })
    );
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("201 for same classSubject + date but different startTime", async () => {
    const res = await request(app).post("/api/attendance").send(
      attBody({ date: DUP_DATE, startTime: "10:00", endTime: "11:00" })
    );
    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Update validates the complete record
// ═══════════════════════════════════════════════════════════════════════════════
describe("PUT /api/attendance/:id — update validation", () => {
  let attId;

  beforeAll(async () => {
    const att = await makeAttendance(
      classA._id, csA1._id, teacher1._id,
      [studentsA[0]._id, studentsA[1]._id],
      { date: "2026-11-25", startTime: "08:00", endTime: "09:00" }
    );
    attId = att._id.toString();
  });

  test("200 updating a student's status", async () => {
    const res = await request(app)
      .put(`/api/attendance/${attId}`)
      .send({
        students: [
          { student: studentsA[0]._id.toString(), status: "absent" },
          { student: studentsA[1]._id.toString(), status: "late"   },
        ],
      });
    expect(res.status).toBe(200);
    const statuses = res.body.data.students.map((s) => s.status);
    expect(statuses).toContain("absent");
    expect(statuses).toContain("late");
  });

  test("400 when update introduces a student from the wrong class", async () => {
    const res = await request(app)
      .put(`/api/attendance/${attId}`)
      .send({
        students: [{ student: studentsB[0]._id.toString(), status: "present" }],
      });
    expect(res.status).toBe(400);
  });

  test("400 when endTime is changed to be <= startTime", async () => {
    const res = await request(app)
      .put(`/api/attendance/${attId}`)
      .send({ startTime: "09:00", endTime: "08:00" });
    expect(res.status).toBe(400);
  });

  test("400 for empty update body", async () => {
    const res = await request(app).put(`/api/attendance/${attId}`).send({});
    expect(res.status).toBe(400);
  });

  test("400 for unsupported fields", async () => {
    const res = await request(app)
      .put(`/api/attendance/${attId}`)
      .send({ unknownField: "value" });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Retrieval by ID, class, and teacher
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /api/attendance — retrieval", () => {
  let attId;

  beforeAll(async () => {
    const att = await makeAttendance(
      classA._id, csA1._id, teacher1._id,
      [studentsA[0]._id],
      { date: "2026-11-28", startTime: "08:00", endTime: "09:00" }
    );
    attId = att._id.toString();
  });

  test("GET /api/attendance returns all records", async () => {
    const res = await request(app).get("/api/attendance");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.count).toBe("number");
  });

  test("GET /api/attendance/:id returns the specific record", async () => {
    const res = await request(app).get(`/api/attendance/${attId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(attId);
  });

  test("GET /api/attendance/class/:classId filters by class", async () => {
    const res = await request(app).get(`/api/attendance/class/${classA._id}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((r) =>
      expect(r.class._id.toString()).toBe(classA._id.toString())
    );
  });

  test("GET /api/attendance/class/:classId?date=... filters by date", async () => {
    const res = await request(app).get(
      `/api/attendance/class/${classA._id}?date=2026-11-28`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    res.body.data.forEach((r) => {
      const d = new Date(r.date).toISOString().slice(0, 10);
      expect(d).toBe("2026-11-28");
    });
  });

  test("GET /api/attendance/teacher/:teacherId filters by teacher", async () => {
    const res = await request(app).get(
      `/api/attendance/teacher/${teacher1._id}`
    );
    expect(res.status).toBe(200);
    res.body.data.forEach((r) =>
      expect(r.teacher._id.toString()).toBe(teacher1._id.toString())
    );
  });

  test("404 for non-existent attendance ID", async () => {
    const res = await request(app).get(
      "/api/attendance/000000000000000000000001"
    );
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Attendance status counts are correct
// ═══════════════════════════════════════════════════════════════════════════════
describe("Attendance status counts", () => {
  let attRecord;

  beforeAll(async () => {
    attRecord = await makeAttendance(
      classA._id, csA1._id, teacher1._id,
      [],
      {
        date: "2026-12-01",
        startTime: "08:00", endTime: "09:00",
        students: [
          { student: studentsA[0]._id, status: "present" },
          { student: studentsA[1]._id, status: "present" },
          { student: studentsA[2]._id, status: "absent"  },
          { student: studentsA[3]._id, status: "late"    },
          { student: studentsA[4]._id, status: "excused" },
          { student: studentsA[5]._id, status: "excused" },
        ],
      }
    );
  });

  test("returned data has correct status counts", async () => {
    const res = await request(app).get(`/api/attendance/${attRecord._id}`);
    expect(res.status).toBe(200);
    const students = res.body.data.students;
    const count = (s) => students.filter((x) => x.status === s).length;
    expect(count("present")).toBe(2);
    expect(count("absent")).toBe(1);
    expect(count("late")).toBe(1);
    expect(count("excused")).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════════════
describe("DELETE /api/attendance/:id", () => {
  test("200 and record no longer exists", async () => {
    const att = await makeAttendance(
      classA._id, csA1._id, teacher1._id,
      [studentsA[0]._id],
      { date: "2026-12-15", startTime: "08:00", endTime: "09:00" }
    );
    const del = await request(app).delete(`/api/attendance/${att._id}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/attendance/${att._id}`);
    expect(get.status).toBe(404);
  });

  test("404 for non-existent record", async () => {
    const res = await request(app).delete(
      "/api/attendance/000000000000000000000001"
    );
    expect(res.status).toBe(404);
  });
});
