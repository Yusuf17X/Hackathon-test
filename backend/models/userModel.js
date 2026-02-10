const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required!"],
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email!"],
    },
    role: {
      type: String,
      enum: ["user", "teacher", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [
        function () {
          return this.isNew || this.isModified("password");
        },
        "Please confirm your password",
      ],
      validate: {
        //* Only works on CREATE and SAVE!!!
        validator: function (value) {
          return value === this.password;
        },
        message: "Passwords are not the same!",
      },
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    school_id: {
      type: mongoose.Schema.ObjectId,
      ref: "School",
    },
    points: {
      type: Number,
      default: 0,
      min: [0, "Points can not be below 0!"],
      required: [true, "A user must have points"],
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.pre("save", async function () {
  // Only run if password is modified
  if (!this.isModified("password")) return;

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the confirm field
  this.passwordConfirm = undefined;
});

userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
});

//* We cant use this.password here since we wrote select: false, in the schema
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
