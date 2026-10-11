# Irahma School — Testing Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Seeding Test Data](#seeding-test-data)
5. [Running Automated Tests](#running-automated-tests)
6. [Postman Manual Testing](#postman-manual-testing)
7. [Test Order and Dependencies](#test-order-and-dependencies)
8. [Cleanup](#cleanup)
9. [Known Issues Fixed](#known-issues-fixed)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| MongoDB | local `mongod` running on port 27017 (for automated tests only) |
| Postman | Any recent version (for manual API testing) |

> [!IMPORTANT]
> **Automated tests connect to `mongodb://127.0.0.1:27017/irahma_test`**, a completely separate
> database from your development Atlas cluster. Your production/development data is **never touched**.

---

## Installation

```bash
# Install all dependencies including dev (jest, supertest)
npm install

# Verify test runner works
npx jest --version
```

---

## Database Setup

### For automated tests — local MongoDB

Make sure `mongod` is running:

```bash
mongod --dbpath /var/lib/mongodb   # Linux system service
# or
sudo systemctl start mongod        # systemd
```

Verify connectivity:

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
# Expected: { ok: 1 }
```

The test suite creates and **drops** the `irahma_test` database automatically after each run.

### For the seed script — Atlas

The seed script uses your real `MONGODB_URI` from `.env`, which points to your Atlas cluster.

---

## Seeding Test Data

The seed script creates a complete, consistent dataset suitable for both automated tests and
Postman manual testing.

### What is created

| Resource | Count | Notes |
|----------|-------|-------|
| Teachers | 4 | teacherNumbers `SEED-T001` … `SEED-T004` |
| Classes | 2 | `9eme-A` and `8eme-B` |
| Students | 12 | 6 per class, studentNumbers `SEED-S001` … `SEED-S012` |
| Subjects | 4 | Math, French, English, Physics (codes `SEED-MATH`, etc.) |
| ClassSubjects | 7 | 4 for classA, 3 for classB |
| Timetable slots | 10 | Mon–Sat, no overlaps, varying rooms |
| Attendance records | 3 | Mixed present/absent/late/excused statuses |

### Run the seed

```bash
node src/seed/seedTestData.js
```

The script is **idempotent** — running it twice will not create duplicates.
Every record is identified by a `SEED-` prefix on unique fields.

At the end, the script prints all generated MongoDB `_id` values — **copy them** into the
Postman environment variables (see Postman section below).

### Default credentials

| Role | Identifier | Password |
|------|-----------|---------|
| Teacher | `SEED-T001` | `SEED-T001` |
| Teacher | `SEED-T002` | `SEED-T002` |
| Student | `SEED-S001` | `SEED-S001` |

Login via `POST /api/auth/login` with `{ teacherNumber, password, role }` or `{ studentNumber, password, role }`.

---

## Running Automated Tests

### All tests

```bash
npm test
```

### Individual test files

```bash
npx jest tests/timetable.test.js --runInBand   # Timetable business logic (11 req + room)
npx jest tests/attendance.test.js --runInBand  # Attendance business logic (12 requirements)
npx jest tests/api.test.js --runInBand         # Auth, Teachers, Students, Classes, Subjects, ClassSubjects
```

> [!TIP]
> Always use `--runInBand` to run tests serially. The tests share a MongoDB connection and
> running in parallel can cause conflicts.

### Watch mode during development

```bash
npx jest --watch --runInBand
```

### Coverage report

```bash
npx jest --coverage --runInBand
```

---

## Postman Manual Testing

### Import steps

1. Open Postman → **Import**
2. Import `postman/Irahma-School-API.postman_collection.json`
3. Import `postman/Irahma-School-Local.postman_environment.json`
4. Select **Irahma School — Local** as the active environment

### Fill in IDs

Run the seed script and copy the printed IDs into the corresponding environment variables:

| Env variable | Value from seed output |
|-------------|----------------------|
| `teacher1Id` | teacher1 (Math) ID |
| `teacher2Id` | teacher2 (French) ID |
| `classAId` | classA (9eme-A) ID |
| `classBId` | classB (8eme-B) ID |
| `mathSubjectId` | Math subject ID |
| `csA_MathId` | csA_Math ClassSubject ID |
| `csA_FrenchId` | csA_French ClassSubject ID |
| `csB_MathId` | csB_Math ClassSubject ID |
| `student1Id` … `student7Id` | Student IDs |
| `attendance1Id` … `attendance3Id` | Attendance record IDs |

### Run the collection

Use **Collection Runner** → select "Irahma School API" → ensure environment is set → **Run**.

> [!NOTE]
> Folder order matters for dependencies:
> **Auth → Teachers → Students → Classes → Subjects → ClassSubjects → Timetable → Attendance**
>
> The Login request auto-saves the token to `{{authToken}}` via a test script.

---

## Test Order and Dependencies

```
Auth login          → sets {{authToken}}
Teachers POST       → sets {{newTeacherId}}
Students POST       → sets {{newStudentId}} (requires {{classAId}} from env)
Classes POST        → sets {{newClassId}}
Subjects POST       → sets {{newSubjectId}}
ClassSubjects POST  → sets {{newCsId}} (requires {{classAId}}, {{mathSubjectId}}, {{teacher1Id}})
Timetable POST      → sets {{newTimetableId}} (requires {{classAId}}, {{csA_MathId}})
Attendance POST     → sets {{newAttendanceId}} (requires all seeded IDs)
```

---

## Cleanup

### Remove only seeded data (safe — never touches other records)

```bash
node src/seed/seedTestData.js --clean
```

The `--clean` flag removes only records whose `teacherNumber`, `studentNumber`, or subject `code`
starts with `SEED-`. All other records are untouched.

### Drop the automated test database

The automated tests call `mongoose.connection.dropDatabase()` in `afterAll`, so the test DB is
dropped automatically. To drop it manually:

```bash
mongosh irahma_test --eval "db.dropDatabase()"
```

---

## Known Issues Fixed

The following bugs were discovered during the test suite creation and have been patched:

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `src/routes/attendance.routes.js` | Wrong controller import path (`attendance.controller` → `attendanceController`) — caused server crash on startup | Fixed import |
| 2 | `src/controllers/timetableController.js` | No room-conflict detection | Added room conflict check in `findConflicts()` — returns 409 "This room is already occupied" |
| 3 | `src/validators/attendance.validator.js` | `startTime >= endTime` not validated in create or update | Added custom validator in both `createAttendanceValidator` and `updateAttendanceValidator` |
| 4 | `src/controllers/attendanceController.js` | `createAttendance` had no server-side time-order guard | Added guard returning 400 |
| 5 | `src/controllers/attendanceController.js` | `updateAttendance` had no time-order guard | Added guard returning 400 |
| 6 | `src/routes/timetable.routes.js` | Stray character `I` at end of file after `module.exports = router;` | Removed stray character |
| 7 | `src/routes/student.routes.js` | Missing `validate` middleware in `POST /api/students/create` — allowed invalid bodies to reach Mongoose and throw 500 instead of returning 400 | Added `validate` middleware |
| 8 | `src/controllers/authController.js` | `getMe` called `.populate("school")` and `.populate("parents")` for non-existent models, causing `MissingSchemaError` (500) | Removed invalid populate calls |
| 9 | `tests/helpers/testApp.js` | Mongoose client handshake in Jest VM environment failing client metadata os resolution | Configured `runtimeAdapters: { os }` and `dns.setDefaultResultOrder("ipv4first")` |

