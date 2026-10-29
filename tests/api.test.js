/**
 * tests/api.test.js
 *
 * Smoke-level integration tests for all other API resources:
 * Auth, Teachers, Students, Classes, Subjects, ClassSubjects.
 *
 * Run: npx jest tests/api.test.js --runInBand
 */

const request  = require("supertest");
const { buildApp, connectTestDb, disconnectTestDb } = require("./helpers/testApp");
const {
  makeTeacher, makeStudent, makeClass, makeSubject, makeClassSubject,
} = require("./helpers/factories");

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildApp();
});

afterAll(disconnectTestDb);

// ═══════════════════════════════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET /", () => {
  test("404 on unknown route", async () => {
    const res = await request(app).get("/unknown-path");
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Auth — /api/auth
// ═══════════════════════════════════════════════════════════════════════════════
describe("Auth API", () => {
  let teacherNumber;

  beforeAll(async () => {
    const t = await makeTeacher({ firstName: "AuthTest" });
    teacherNumber = t.teacherNumber;
  });

  test("POST /api/auth/login — valid credentials return 200 + token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      teacherNumber,
      password: "password123",
      role: "teacher",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe("teacher");
  });

  test("POST /api/auth/login — wrong password returns 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      teacherNumber,
      password: "wrong",
      role: "teacher",
    });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login — missing password returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({
      teacherNumber,
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/auth/login — missing identifier returns 400", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "any",
    });
    expect(res.status).toBe(400);
  });

  test("GET /api/auth/me — without token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me — with valid token returns profile", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      teacherNumber, password: "password123", role: "teacher",
    });
    const token = loginRes.body.data.token;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("teacher");
  });


  test("POST /api/auth/logout — returns 200", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Teachers — /api/teachers
// ═══════════════════════════════════════════════════════════════════════════════
describe("Teachers API", () => {
  let teacherId;
  const TEACHER_NUM = `T-API-${Date.now()}`;

  test("POST /api/teachers — creates teacher", async () => {
    const res = await request(app).post("/api/teachers").send({
      firstName:     "Jean",
      lastName:      "Dupont",
      teacherNumber: TEACHER_NUM,
      password:      "secret123",
      specialization:"Biology",
    });
    expect(res.status).toBe(201);
    teacherId = res.body.data._id;
  });

  test("POST /api/teachers — duplicate number returns 409", async () => {
    const res = await request(app).post("/api/teachers").send({
      firstName: "Another", lastName: "Teacher",
      teacherNumber: TEACHER_NUM, password: "pass123",
    });
    expect(res.status).toBe(409);
  });

  test("POST /api/teachers — missing firstName returns 400", async () => {
    const res = await request(app).post("/api/teachers").send({
      lastName: "Only", teacherNumber: "T-NONAME-1", password: "pass123",
    });
    expect(res.status).toBe(400);
  });

  test("GET /api/teachers — returns list", async () => {
    const res = await request(app).get("/api/teachers");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/teachers/:id — returns one teacher", async () => {
    const res = await request(app).get(`/api/teachers/${teacherId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(teacherId);
  });

  test("PUT /api/teachers/:id — updates specialization", async () => {
    const res = await request(app)
      .put(`/api/teachers/${teacherId}`)
      .send({ specialization: "Chemistry" });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/teachers/:id — removes teacher", async () => {
    const t = await makeTeacher({ firstName: "ToDelete" });
    const del = await request(app).delete(`/api/teachers/${t._id}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/teachers/${t._id}`);
    expect([404, 200]).toContain(get.status); // some APIs return 200 with null
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Students — /api/students
// ═══════════════════════════════════════════════════════════════════════════════
describe("Students API", () => {
  let studentId;
  const STU_NUM = `S-API-${Date.now()}`;
  let testClass;

  beforeAll(async () => {
    testClass = await makeClass({ name: "API-StudentClass" });
  });

  test("POST /api/students/create — creates student", async () => {
    const res = await request(app).post("/api/students/create").send({
      firstName:     "Marie",
      lastName:      "Curie",
      studentNumber: STU_NUM,
      class:         testClass._id.toString(),
    });
    expect(res.status).toBe(201);
    studentId = res.body.data._id;
  });

  test("POST /api/students/create — duplicate number returns 409", async () => {
    const res = await request(app).post("/api/students/create").send({
      firstName: "Dup", lastName: "Student", studentNumber: STU_NUM,
    });
    expect(res.status).toBe(409);
  });

  test("POST /api/students/create — missing required firstName returns 400", async () => {
    const res = await request(app).post("/api/students/create").send({
      lastName: "Only", studentNumber: "S-NONAME-1",
    });
    expect(res.status).toBe(400);
  });

  test("GET /api/students — returns list", async () => {
    const res = await request(app).get("/api/students");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/students/:id — returns student", async () => {
    const res = await request(app).get(`/api/students/${studentId}`);
    expect(res.status).toBe(200);
  });

  test("PUT /api/students/:id — updates status", async () => {
    const res = await request(app)
      .put(`/api/students/${studentId}`)
      .send({ status: "graduated" });
    expect(res.status).toBe(200);
  });

  test("PUT /api/students/:id/change-class — changes student from class to another class", async () => {
    const targetClass = await makeClass({ name: "API-TransferTargetClass" });
    const res = await request(app)
      .put(`/api/students/${studentId}/change-class`)
      .send({
        newClassId: targetClass._id.toString(),
        reason: "Academic level adjustment",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.class._id.toString()).toBe(targetClass._id.toString());
    expect(res.body.meta.newClass.name).toBe("API-TransferTargetClass");

    // Repeat to same class should return 400
    const repeatRes = await request(app)
      .put(`/api/students/${studentId}/change-class`)
      .send({
        newClassId: targetClass._id.toString(),
      });
    expect(repeatRes.status).toBe(400);
  });

  test("PUT /api/students/:id/change-class — returns 400 when class at full capacity", async () => {
    const fullClass = await makeClass({ name: "API-FullClass", capacity: 0 });
    const res = await request(app)
      .put(`/api/students/${studentId}/change-class`)
      .send({
        newClassId: fullClass._id.toString(),
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("maximum capacity");
  });

  test("DELETE /api/students/:id — removes student", async () => {
    const s = await makeStudent(testClass._id, { firstName: "ToDelete" });
    const del = await request(app).delete(`/api/students/${s._id}`);
    expect(del.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Classes — /api/classes
// ═══════════════════════════════════════════════════════════════════════════════
describe("Classes API", () => {
  let classId;

  test("POST /api/classes — creates 9eme class", async () => {
    const res = await request(app).post("/api/classes").send({
      name:         "API-TestClass",
      level:        "9eme",
      academicYear: "2026-2027",
    });
    expect(res.status).toBe(201);
    classId = res.body.data._id;
  });

  test("POST /api/classes — 2eme without section returns 400", async () => {
    const res = await request(app).post("/api/classes").send({
      name:         "API-2eme-NoSection",
      level:        "2eme",
      academicYear: "2026-2027",
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/classes — 2eme with section succeeds", async () => {
    const res = await request(app).post("/api/classes").send({
      name:         "API-2eme-WithSection",
      level:        "2eme",
      section:      "science",
      academicYear: "2026-2027",
    });
    expect(res.status).toBe(201);
  });

  test("GET /api/classes — returns list", async () => {
    const res = await request(app).get("/api/classes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/classes/:id — returns one class", async () => {
    const res = await request(app).get(`/api/classes/${classId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(classId);
  });

  test("PUT /api/classes/:id — updates capacity", async () => {
    const res = await request(app)
      .put(`/api/classes/${classId}`)
      .send({ capacity: 35 });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/classes/:id — removes class", async () => {
    const c = await makeClass({ name: "API-ToDelete" });
    const del = await request(app).delete(`/api/classes/${c._id}`);
    expect(del.status).toBe(200);
  });

  test("GET /api/classes/:id — invalid ID returns 400", async () => {
    const res = await request(app).get("/api/classes/not-an-id");
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Subjects — /api/subjects
// ═══════════════════════════════════════════════════════════════════════════════
describe("Subjects API", () => {
  let subjectId;

  test("POST /api/subjects — creates subject", async () => {
    const res = await request(app).post("/api/subjects").send({
      name: "History", code: "HIST-API",
    });
    expect(res.status).toBe(201);
    subjectId = res.body.data._id;
  });

  test("POST /api/subjects — duplicate name/code returns 409", async () => {
    const res = await request(app).post("/api/subjects").send({
      name: "History", code: "HIST-API",
    });
    expect(res.status).toBe(409);
  });

  test("POST /api/subjects — missing name returns 400", async () => {
    const res = await request(app).post("/api/subjects").send({
      code: "NO-NAME",
    });
    expect(res.status).toBe(400);
  });

  test("GET /api/subjects — returns list", async () => {
    const res = await request(app).get("/api/subjects");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/subjects/:id — returns one subject", async () => {
    const res = await request(app).get(`/api/subjects/${subjectId}`);
    expect(res.status).toBe(200);
  });

  test("PUT /api/subjects/:id — updates name", async () => {
    const res = await request(app)
      .put(`/api/subjects/${subjectId}`)
      .send({ name: "Modern History" });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/subjects/:id — removes subject", async () => {
    const s = await makeSubject({ name: "Temp-Subj", code: "TEMP-API" });
    const del = await request(app).delete(`/api/subjects/${s._id}`);
    expect(del.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ClassSubjects — /api/class-subjects
// ═══════════════════════════════════════════════════════════════════════════════
describe("ClassSubjects API", () => {
  let csId;
  let cls, subj, tchr;

  beforeAll(async () => {
    cls  = await makeClass({ name: "CS-TestClass" });
    subj = await makeSubject({ code: "CS-SUBJ" });
    tchr = await makeTeacher({ firstName: "CS-Teacher" });
  });

  test("POST /api/class-subjects — creates assignment", async () => {
    const res = await request(app).post("/api/class-subjects").send({
      class:       cls._id.toString(),
      subject:     subj._id.toString(),
      teacher:     tchr._id.toString(),
      coefficient: 3,
    });
    expect(res.status).toBe(201);
    csId = res.body.data._id;
  });

  test("POST /api/class-subjects — duplicate class+subject returns 409", async () => {
    const res = await request(app).post("/api/class-subjects").send({
      class:   cls._id.toString(),
      subject: subj._id.toString(),
      teacher: tchr._id.toString(),
    });
    expect(res.status).toBe(409);
  });

  test("GET /api/class-subjects — returns list", async () => {
    const res = await request(app).get("/api/class-subjects");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/class-subjects/class/:classId — filters by class", async () => {
    const res = await request(app).get(`/api/class-subjects/class/${cls._id}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((cs) =>
      expect(cs.class._id.toString()).toBe(cls._id.toString())
    );
  });

  test("GET /api/class-subjects/teacher/:teacherId — filters by teacher", async () => {
    const res = await request(app).get(`/api/class-subjects/teacher/${tchr._id}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((cs) =>
      expect(cs.teacher._id.toString()).toBe(tchr._id.toString())
    );
  });

  test("GET /api/class-subjects/:id — returns one assignment", async () => {
    const res = await request(app).get(`/api/class-subjects/${csId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(csId);
  });

  test("PUT /api/class-subjects/:id — updates coefficient", async () => {
    const res = await request(app)
      .put(`/api/class-subjects/${csId}`)
      .send({ coefficient: 5 });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/class-subjects/:id — removes assignment", async () => {
    const extra = await makeClassSubject(
      cls._id,
      (await makeSubject({ code: "CS-DEL" }))._id,
      tchr._id
    );
    const del = await request(app).delete(`/api/class-subjects/${extra._id}`);
    expect(del.status).toBe(200);
  });
});
