const { body } = require("express-validator");

const loginValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  // At least one identifier must be provided
  body().custom((value, { req }) => {
    const identifier =
      req.body.email ||
      req.body.identifier ||
      req.body.studentNumber ||
      req.body.teacherNumber;

    if (!identifier || (typeof identifier === "string" && !identifier.trim())) {
      throw new Error(
        "Email, studentNumber, teacherNumber or identifier is required"
      );
    }
    return true;
  }),
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6, max: 128 })
    .withMessage("New password must be between 6 and 128 characters"),
];

module.exports = {
  loginValidator,
  changePasswordValidator,
};
