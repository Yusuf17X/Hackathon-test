const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

const userChallenge = require("./../models/userChallengeModel");
const userBadge = require("./../models/userBadgeModel");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/users/img");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload images only.", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((ele) => {
    if (allowedFields.includes(ele)) newObj[ele] = obj[ele];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;

  next();
};

exports.getProfile = catchAsync(async (req, res, next) => {
  const Badge = require("./../models/badgeModel");
  const {
    t,
    formatMemberSince,
    MS_PER_DAY,
  } = require("./../utils/translations");

  // Get user with populated school
  const user = await User.findById(req.user._id).populate(
    "school_id",
    "name city",
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Calculate level based on points
  const { points } = user;
  let level = {
    current: 1,
    name: "beginner",
    nameAr: t("beginner"),
    pointsToNextLevel: 50,
    hasNextLevel: true,
  };

  if (points >= 800) {
    level = {
      current: 6,
      name: "eco_expert",
      nameAr: t("eco_expert"),
      pointsToNextLevel: 0,
      hasNextLevel: false,
    };
  } else if (points >= 500) {
    level = {
      current: 5,
      name: "eco_hero",
      nameAr: t("eco_hero"),
      pointsToNextLevel: 800 - points,
      hasNextLevel: true,
    };
  } else if (points >= 300) {
    level = {
      current: 4,
      name: "enthusiast",
      nameAr: t("enthusiast"),
      pointsToNextLevel: 500 - points,
      hasNextLevel: true,
    };
  } else if (points >= 150) {
    level = {
      current: 3,
      name: "active",
      nameAr: t("active"),
      pointsToNextLevel: 300 - points,
      hasNextLevel: true,
    };
  } else if (points >= 50) {
    level = {
      current: 2,
      name: "learner",
      nameAr: t("learner"),
      pointsToNextLevel: 150 - points,
      hasNextLevel: true,
    };
  }

  // Get completed challenges count
  const completedChallenges = await userChallenge.countDocuments({
    user_id: req.user._id,
    status: "approved",
  });

  // Calculate streak
  let streak = 0;
  if (user.lastActivityDate) {
    const now = new Date();
    const lastActivity = new Date(user.lastActivityDate);
    const diffDays = Math.floor((now - lastActivity) / MS_PER_DAY);

    if (diffDays === 0 || diffDays === 1) {
      streak = user.currentStreak;
    }
  }

  // Format member since date
  const memberSinceFormatted = formatMemberSince(user.createdAt);

  // Get all badges and check which ones the user has earned
  const allBadges = await Badge.find();
  const userBadgesData = await userBadge.find({ user_id: req.user._id });
  const earnedBadgeIds = userBadgesData.map((ub) => ub.badge_id.toString());

  const badges = allBadges.map((badge) => ({
    name: badge.name,
    icon: badge.icon,
    isEarned: earnedBadgeIds.includes(badge._id.toString()),
  }));

  // Get last 5 activities (merge UserChallenges and UserBadges)
  const userChallenges = await userChallenge
    .find({ user_id: req.user._id })
    .populate("challenge_id", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  const userBadgesActivities = await userBadge
    .find({ user_id: req.user._id })
    .populate("badge_id", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  const activities = [
    ...userChallenges.map((uc) => ({
      type: "challenge",
      name: uc.challenge_id?.name || "Unknown Challenge",
      date: uc.createdAt,
    })),
    ...userBadgesActivities.map((ub) => ({
      type: "badge",
      name: ub.badge_id?.name || "Unknown Badge",
      date: ub.createdAt,
    })),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  res.status(200).json({
    status: "success",
    data: {
      name: user.name,
      school: user.school_id
        ? { name: user.school_id.name, city: user.school_id.city }
        : null,
      points: user.points,
      level,
      completedChallengesCount: completedChallenges,
      streak,
      memberSince: memberSinceFormatted,
      badges,
      lastActivities: activities,
    },
  });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. please use /update-password",
        400,
      ),
    );

  const filteredBody = filterObject(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.getSchoolLeaderboard = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user._id).populate(
    "school_id",
    "name city",
  );

  if (!currentUser) {
    return next(new AppError("User not found", 404));
  }

  if (!currentUser.school_id) {
    return next(new AppError("User does not belong to a school", 400));
  }

  // Get top 100 users from the same school
  const top100Users = await User.find({ school_id: currentUser.school_id })
    .select("name points school_id")
    .populate("school_id", "name")
    .sort({ points: -1 })
    .limit(100)
    .lean();

  // Create leaderboard with ranks
  const leaderboard = top100Users.map((user, index) => ({
    rank: index + 1,
    name: user.name,
    points: user.points,
    school: user.school_id?.name || "",
    isCurrentUser: user._id.toString() === currentUser._id.toString(),
  }));

  // Check if current user is in top 100
  const currentUserInTop100 = leaderboard.find((entry) => entry.isCurrentUser);

  // If not in top 100, calculate actual rank and add as 101st item
  if (!currentUserInTop100) {
    const usersAhead = await User.countDocuments({
      school_id: currentUser.school_id,
      points: { $gt: currentUser.points },
    });

    const actualRank = usersAhead + 1;

    leaderboard.push({
      rank: actualRank,
      name: currentUser.name,
      points: currentUser.points,
      school: currentUser.school_id?.name || "",
      isCurrentUser: true,
    });
  }

  res.status(200).json({
    status: "success",
    results: leaderboard.length,
    data: {
      leaderboard,
    },
  });
});

exports.getIraqLeaderboard = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user._id).populate(
    "school_id",
    "name city",
  );

  if (!currentUser) {
    return next(new AppError("User not found", 404));
  }

  // Get top 100 users from all of Iraq
  const top100Users = await User.find()
    .select("name points school_id")
    .populate("school_id", "name")
    .sort({ points: -1 })
    .limit(100)
    .lean();

  // Create leaderboard with ranks
  const leaderboard = top100Users.map((user, index) => ({
    rank: index + 1,
    name: user.name,
    points: user.points,
    school: user.school_id?.name || "",
    isCurrentUser: user._id.toString() === currentUser._id.toString(),
  }));

  // Check if current user is in top 100
  const currentUserInTop100 = leaderboard.find((entry) => entry.isCurrentUser);

  // If not in top 100, calculate actual rank and add as 101st item
  if (!currentUserInTop100) {
    const usersAhead = await User.countDocuments({
      points: { $gt: currentUser.points },
    });

    const actualRank = usersAhead + 1;

    leaderboard.push({
      rank: actualRank,
      name: currentUser.name,
      points: currentUser.points,
      school: currentUser.school_id?.name || "",
      isCurrentUser: true,
    });
  }

  res.status(200).json({
    status: "success",
    results: leaderboard.length,
    data: {
      leaderboard,
    },
  });
});
