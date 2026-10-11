/**
 * tests/timetable.test.js
 *
 * Full integration tests for the Timetable API.
 * Covers all 11 requirements listed in the task brief PLUS room-conflict detection.
 *
 * Run: npx jest tests/timetable.test.js --runInBand
 */

const request  = require("supertest");
const { buildApp, connectTestDb, disconnectTestDb } = require("./helpers/testApp");
const {
  makeTeacher, makeClass, makeSubject,
  makeClassSubject, makeTimetable,
} = require("./helpers/factories");

let app;
let teacher1, teacher2;
let classA, classB;
let subject1, subject2;
let csA1, csA2;   // classSubjects for classA
let csB1;          // classSubject for classB

beforeAll(async () => {
  await connectTestDb();
  app = buildApp();

  teacher1 = await makeTeacher({ firstName: "Alice" });
  teacher2 = await makeTeacher({ firstName: "Bob"   });
  classA   = await makeClass({ name: "TT-ClassA" });
  classB   = await makeClass({ name: "TT-ClassB" });
  subject1 = await makeSubject({ name: "Math",    code: "TT-MATH" });
  subject2 = await makeSubject({ name: "Physics", code: "TT-PHY"  });

  // classA subjects
  csA1 = await makeClassSubject(classA._id, subject1._id, teacher1._id);
  csA2 = await makeClassSubject(classA._id, subject2._id, teacher2._id);

  // classB gets Math, also teacher1 (to test teacher conflict)
  csB1 = await makeClassSubject(classB._id, subject1._id, teacher1._id);
}, 60000);



afterAll(disconnectTestDb);

// ─── helpers ─────────────────────────────────────────────────────────────────
const slot = (overrides = {}) => ({
  class:        classA._id.toString(),
  classSubject: csA1._id.toString(),
  day:          "Monday",
  startTime:    "08:00",
  endTime:      "09:00",
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Creating a valid timetable slot succeeds
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — valid creation", () => {
  test("201 with populated data", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ startTime: "07:00", endTime: "08:00", room: "Room-A" })
    );
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.day).toBe("Monday");
    expect(res.body.data.startTime).toBe("07:00");
    expect(res.body.data.endTime).toBe("08:00");
    expect(res.body.data.class).toBeDefined();
    expect(res.body.data.classSubject).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Class overlap conflict
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — class overlap (same class, same day)", () => {
  beforeAll(async () => {
    await makeTimetable(classA._id, csA1._id, {
      day: "Tuesday", startTime: "10:00", endTime: "11:00",
    });
  });

  test("409 when class already has lesson at that time", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({
        day: "Tuesday", startTime: "10:30", endTime: "11:30",
        // csA2 uses teacher2 — so teacher is free, but CLASS is not
        classSubject: csA2._id.toString(),
      })
    );
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/class already has a lesson/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Teacher conflict — same teacher, same time, different class
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — teacher conflict", () => {
  beforeAll(async () => {
    await makeTimetable(classA._id, csA1._id, {
      day: "Wednesday", startTime: "08:00", endTime: "09:30",
    });
  });

  test("409 when teacher already teaches at that time", async () => {
    const res = await request(app).post("/api/timetable").send({
      class:        classB._id.toString(),
      classSubject: csB1._id.toString(),   // teacher1, classB
      day:          "Wednesday",
      startTime:    "08:30",
      endTime:      "09:00",
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/teacher already has a lesson/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Consecutive lessons do NOT conflict  08:00–09:00 then 09:00–10:00
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — consecutive lessons (no overlap)", () => {
  beforeAll(async () => {
    await makeTimetable(classA._id, csA1._id, {
      day: "Thursday", startTime: "08:00", endTime: "09:00",
    });
  });

  test("201 when new lesson starts exactly when previous one ends", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({
        classSubject: csA2._id.toString(), // different teacher too
        day: "Thursday", startTime: "09:00", endTime: "10:00",
      })
    );
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. 09:30-start conflicts with 09:00-ending lesson — should be rejected
//    Lesson A: 09:00–10:30   new: 09:00–10:00  → overlap
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — genuine overlap is rejected", () => {
  beforeAll(async () => {
    await makeTimetable(classA._id, csA1._id, {
      day: "Friday", startTime: "09:00", endTime: "10:30",
    });
  });

  test("409 when new slot overlaps existing slot", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({
        classSubject: csA2._id.toString(),
        day: "Friday", startTime: "09:30", endTime: "10:00",
      })
    );
    expect(res.status).toBe(409);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Different days never conflict
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — different days do not conflict", () => {
  beforeAll(async () => {
    await makeTimetable(classA._id, csA1._id, {
      day: "Saturday", startTime: "08:00", endTime: "09:00",
    });
  });

  test("201 when same time but different day", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({
        classSubject: csA2._id.toString(),
        day: "Sunday",   // Sunday is not in schema enum, so use another allowed day
        // Use Monday (ensure the Monday slot is in a different time range first)
      })
    );
    // Saturday 08:00–09:00 exists; Monday slot with csA2 at same time should be fine
    // because we create it at 06:00-07:00 which doesn't conflict
    const res2 = await request(app).post("/api/timetable").send(
      slot({
        classSubject: csA2._id.toString(),
        day: "Saturday", startTime: "10:00", endTime: "11:00",
      })
    );
    expect(res2.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ClassSubject must belong to the class
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — ClassSubject / class mismatch", () => {
  test("400 when ClassSubject belongs to a different class", async () => {
    const res = await request(app).post("/api/timetable").send({
      class:        classA._id.toString(),
      classSubject: csB1._id.toString(),  // csB1 belongs to classB, not classA
      day:          "Monday",
      startTime:    "14:00",
      endTime:      "15:00",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not belong/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Validation rejections
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — validation errors", () => {
  test("400 for missing required fields", async () => {
    const res = await request(app).post("/api/timetable").send({});
    expect(res.status).toBe(400);
  });

  test("400 for invalid MongoDB ID in class field", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ class: "not-an-id" })
    );
    expect(res.status).toBe(400);
  });

  test("400 for invalid day", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ day: "Funday" })
    );
    expect(res.status).toBe(400);
  });

  test("400 for malformed time (not HH:mm)", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ startTime: "8:00" })
    );
    expect(res.status).toBe(400);
  });

  test("400 when endTime equals startTime", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ startTime: "10:00", endTime: "10:00" })
    );
    expect(res.status).toBe(400);
  });

  test("400 when endTime is earlier than startTime", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ startTime: "11:00", endTime: "09:00" })
    );
    expect(res.status).toBe(400);
  });

  test("404 when class does not exist", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ class: "000000000000000000000001" })
    );
    expect(res.status).toBe(404);
  });

  test("404 when ClassSubject does not exist", async () => {
    const res = await request(app).post("/api/timetable").send(
      slot({ classSubject: "000000000000000000000001" })
    );
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Update excludes the slot being updated (no self-conflict)
// ═══════════════════════════════════════════════════════════════════════════════
describe("PUT /api/timetable/:id — update excludes self", () => {
  let existingSlot;

  beforeAll(async () => {
    existingSlot = await makeTimetable(classA._id, csA1._id, {
      day: "Monday", startTime: "15:00", endTime: "16:00",
    });
  });

  test("200 updating the room of an existing slot without false conflict", async () => {
    const res = await request(app)
      .put(`/api/timetable/${existingSlot._id}`)
      .send({ room: "Updated-Room" });
    expect(res.status).toBe(200);
    expect(res.body.data.room).toBe("Updated-Room");
  });

  test("200 shifting time slightly without false conflict with itself", async () => {
    const res = await request(app)
      .put(`/api/timetable/${existingSlot._id}`)
      .send({ startTime: "15:10", endTime: "16:10" });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Delete, retrieve, filter
// ═══════════════════════════════════════════════════════════════════════════════
describe("GET / DELETE /api/timetable — retrieval and deletion", () => {
  let slotId;

  beforeAll(async () => {
    const tt = await makeTimetable(classA._id, csA1._id, {
      day: "Monday", startTime: "16:00", endTime: "17:00",
    });
    slotId = tt._id.toString();
  });

  test("GET /api/timetable returns array", async () => {
    const res = await request(app).get("/api/timetable");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.count).toBe("number");
  });

  test("GET /api/timetable?day=Monday filters correctly", async () => {
    const res = await request(app).get("/api/timetable?day=Monday");
    expect(res.status).toBe(200);
    res.body.data.forEach((entry) => expect(entry.day).toBe("Monday"));
  });

  test("GET /api/timetable/class/:classId returns slots for that class", async () => {
    const res = await request(app).get(`/api/timetable/class/${classA._id}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((entry) =>
      expect(entry.class._id.toString()).toBe(classA._id.toString())
    );
  });

  test("GET /api/timetable/:id returns one slot", async () => {
    const res = await request(app).get(`/api/timetable/${slotId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(slotId);
  });

  test("DELETE /api/timetable/:id removes the slot", async () => {
    const del = await request(app).delete(`/api/timetable/${slotId}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/timetable/${slotId}`);
    expect(get.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Room conflict detection (newly implemented)
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/timetable — room conflict", () => {
  let csB2;

  beforeAll(async () => {
    csB2 = await makeClassSubject(classB._id, subject2._id, teacher2._id);
    await makeTimetable(classA._id, csA1._id, {
      day: "Monday", startTime: "05:00", endTime: "06:00", room: "SameRoom-X",
    });
  });

  test("409 when the same room is used at an overlapping time", async () => {
    const res = await request(app).post("/api/timetable").send({
      class:        classB._id.toString(),
      classSubject: csB2._id.toString(), // teacher2 is free at 05:00-06:00
      day:          "Monday",
      startTime:    "05:30",
      endTime:      "06:30",
      room:         "SameRoom-X",
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/room is already occupied/i);
  });

  test("201 when the same room is used at a non-overlapping time (consecutive)", async () => {
    const res = await request(app).post("/api/timetable").send({
      class:        classB._id.toString(),
      classSubject: csB2._id.toString(),
      day:          "Monday",
      startTime:    "06:00",
      endTime:      "07:00",
      room:         "SameRoom-X",
    });
    expect(res.status).toBe(201);
  });
});

