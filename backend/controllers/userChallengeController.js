const multer = require("multer");
const factory = require("./handlerFactory");
const UserChallenge = require("../models/userChallengeModel");
const Challenge = require("../models/challengeModel");
const User = require("../models/userModel");
const Badge = require("../models/badgeModel");
const UserBadge = require("../models/userBadgeModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateEncouragingPhrase } = require("../utils/ecoImpact");

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

  // Verify that challenge exists before creating UserChallenge
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

  // Populate the userChallenge to return data
  await userChallenge.populate([
    { path: "challenge_id" },
    { path: "user_id", select: "name email" },
  ]);

  // Generate encouraging phrase
  let encouragingPhrase = null;
  if (userChallenge.challenge_id && userChallenge.challenge_id.ecoImpact) {
    encouragingPhrase = generateEncouragingPhrase(userChallenge.challenge_id.ecoImpact);
  }

  res.status(201).json({
    status: "success",
    data: {
      challenge: userChallenge.challenge_id,
      userChallenge,
      encouragingPhrase,
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
    .populate("challenge_id", "name description points icon")
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
  const userChallenge = await UserChallenge.findById(req.params.id).populate({
    path: "user_id",
    select: "school_id",
  });

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

  // Only process if status is approved and challenge was previously pending
  if (status === "approved" && userChallenge.status === "pending") {
    // Get challenge details to award points
    const challenge = await Challenge.findById(userChallenge.challenge_id);
    if (!challenge) {
      return next(new AppError("Challenge not found!", 404));
    }

    // Get user
    const user = await User.findById(userChallenge.user_id);
    if (!user) {
      return next(new AppError("User not found!", 404));
    }

    // Update user points
    user.points += challenge.points;

    // Update user streak using UTC time for consistency
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (user.lastActivityDate) {
      const lastActivity = new Date(user.lastActivityDate);
      lastActivity.setUTCHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (today - lastActivity) / (1000 * 60 * 60 * 24),
      );

      if (daysDifference === 1) {
        // Consecutive day
        user.currentStreak += 1;
      } else if (daysDifference > 1) {
        // Streak broken
        user.currentStreak = 1;
      }
      // If same day (daysDifference === 0), don't update streak
    } else {
      // First activity
      user.currentStreak = 1;
    }

    user.lastActivityDate = new Date();
    await user.save({ validateBeforeSave: false });

    // Count previously approved challenges (excluding current one)
    const approvedChallengesCount = await UserChallenge.countDocuments({
      user_id: user._id,
      status: "approved",
      _id: { $ne: userChallenge._id },
    });

    // Check and award badges
    const allBadges = await Badge.find();
    const userBadges = await UserBadge.find({ user_id: user._id });
    const earnedBadgeIds = userBadges.map((ub) => ub.badge_id.toString());

    const badgesToAward = [];

    for (const badge of allBadges) {
      // Skip if already earned
      if (earnedBadgeIds.includes(badge._id.toString())) {
        continue;
      }

      let shouldAward = false;

      if (badge.requirement_type === "points_threshold") {
        if (user.points >= badge.requirement_value) {
          shouldAward = true;
        }
      } else if (badge.requirement_type === "challenges_count") {
        // Add 1 to include the current challenge being approved
        if (approvedChallengesCount + 1 >= badge.requirement_value) {
          shouldAward = true;
        }
      }

      if (shouldAward) {
        badgesToAward.push({
          user_id: user._id,
          badge_id: badge._id,
        });
      }
    }

    // Batch insert all badges at once if any need to be awarded
    if (badgesToAward.length > 0) {
      await UserBadge.insertMany(badgesToAward);
    }
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
