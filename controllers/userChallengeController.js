const multer = require("multer");
const factory = require("./handlerFactory");
const UserChallenge = require("../models/userChallengeModel");
const Challenge = require("../models/challengeModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Multer configuration for disk storage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/user-challenges/img");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `userChallenge-${req.user._id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload images only.", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadChallengePhoto = upload.single("photo");

// POST /api/v1/user-challenges - Submit UserChallenge with Photo
exports.createUserChallenge = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please provide a photo proof!", 400));
  }

  if (!req.body.challenge_id) {
    return next(new AppError("Please provide a challenge_id!", 400));
  }

  // Verify that challenge exists
  const challenge = await Challenge.findById(req.body.challenge_id);
  if (!challenge) {
    return next(new AppError("Challenge not found!", 404));
  }

  // Create userChallenge with uploaded photo path
  const userChallenge = await UserChallenge.create({
    user_id: req.user._id,
    challenge_id: req.body.challenge_id,
    proof_url: req.file.filename,
    status: "pending",
  });

  // Populate the userChallenge to return challenge data
  await userChallenge.populate([
    { path: "challenge_id" },
    { path: "user_id", select: "name email" },
  ]);

  res.status(201).json({
    status: "success",
    data: {
      challenge,
      userChallenge,
    },
  });
});

// GET /api/v1/user-challenges - Review UserChallenges with Permissions
exports.getAllUserChallenges = catchAsync(async (req, res, next) => {
  let filter = {};

  // Admin can see all challenges
  if (req.user.role === "admin") {
    // No filter needed for admin
  }
  // Teacher can only see challenges for students in their school
  else if (req.user.role === "teacher") {
    // Get all users in the teacher's school
    const schoolUsers = await User.find({ school_id: req.user.school_id }).select("_id");
    const userIds = schoolUsers.map((u) => u._id);
    filter.user_id = { $in: userIds };
  }
  // Regular users can only see their own challenges
  else {
    filter.user_id = req.user._id;
  }

  const userChallenges = await UserChallenge.find(filter)
    .populate("challenge_id", "name description points emoji")
    .populate({
      path: "user_id",
      select: "name email school_id",
      populate: {
        path: "school_id",
        select: "name city",
      },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: userChallenges.length,
    data: {
      userChallenges,
    },
  });
});

// PATCH /api/v1/user-challenges/:id - Approve/Reject UserChallenge
exports.updateUserChallengeStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  // Validate status
  if (!status || !["approved", "rejected"].includes(status)) {
    return next(
      new AppError(
        "Please provide a valid status (approved or rejected)!",
        400,
      ),
    );
  }

  // Find the userChallenge
  const userChallenge = await UserChallenge.findById(req.params.id).populate(
    "user_id",
    "school_id",
  );

  if (!userChallenge) {
    return next(new AppError("UserChallenge not found!", 404));
  }

  // Check permissions
  if (req.user.role === "admin") {
    // Admin can approve/reject any challenge
  } else if (req.user.role === "teacher") {
    // Teacher can only approve/reject challenges from students in their school
    if (
      !userChallenge.user_id.school_id ||
      userChallenge.user_id.school_id.toString() !== req.user.school_id.toString()
    ) {
      return next(
        new AppError(
          "You can only approve/reject challenges from students in your school!",
          403,
        ),
      );
    }
  } else {
    return next(
      new AppError("You do not have permission to perform this action!", 403),
    );
  }

  // Update the status
  userChallenge.status = status;
  await userChallenge.save();

  // Populate for response
  await userChallenge.populate([
    { path: "challenge_id", select: "name description points" },
    { path: "user_id", select: "name email" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      userChallenge,
    },
  });
});
