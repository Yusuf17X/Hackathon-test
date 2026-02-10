const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const School = require("../models/schoolModel");
const User = require("../models/userModel");

exports.aliasTopSchools = (req, res, next) => {
  req.queryOverrides = {
    ...req.query,
    limit: "5",
    sort: "-total_points",
    fields: "name",
  };

  next();
};

exports.getAllSchools = factory.getAll(School);

exports.createSchool = factory.createOne(School);

// Leaderboard: Iraq-level school leaderboard
exports.getSchoolsLeaderboard = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    return next(new AppError("User not found", 404));
  }

  // aggregate users by school_id to get total points and student count
  const top100Schools = await User.aggregate([
    {
      $match: {
        school_id: { $exists: true, $ne: null },
        active: { $ne: false },
      },
    },
    {
      $group: {
        _id: "$school_id",
        totalPoints: { $sum: "$points" },
        studentCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalPoints: -1 },
    },
    {
      $limit: 100,
    },
    {
      $lookup: {
        from: "schools",
        localField: "_id",
        foreignField: "_id",
        as: "schoolInfo",
      },
    },
    {
      $unwind: "$schoolInfo",
    },
    {
      $project: {
        _id: 1,
        name: "$schoolInfo.name",
        city: "$schoolInfo.city",
        totalPoints: 1,
        studentCount: 1,
      },
    },
  ]);

  // Create leaderboard with ranks
  const leaderboard = top100Schools.map((school, index) => ({
    rank: index + 1,
    name: school.name,
    city: school.city,
    totalPoints: school.totalPoints,
    studentCount: school.studentCount,
    isCurrentUserSchool:
      currentUser.school_id &&
      school._id.toString() === currentUser.school_id.toString(),
  }));

  // Check if current user's school is in top 100
  const currentUserSchoolInTop100 = leaderboard.find(
    (entry) => entry.isCurrentUserSchool,
  );

  // If not in top 100 calculate actual rank and add as 101st item
  if (!currentUserSchoolInTop100 && currentUser.school_id) {
    // Get current user's school aggregated data
    const currentSchoolData = await User.aggregate([
      {
        $match: {
          school_id: currentUser.school_id,
          active: { $ne: false },
        },
      },
      {
        $group: {
          _id: "$school_id",
          totalPoints: { $sum: "$points" },
          studentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo",
        },
      },
      {
        $unwind: "$schoolInfo",
      },
      {
        $project: {
          _id: 1,
          name: "$schoolInfo.name",
          city: "$schoolInfo.city",
          totalPoints: 1,
          studentCount: 1,
        },
      },
    ]);

    if (currentSchoolData.length > 0) {
      const currentSchool = currentSchoolData[0];

      // Count how many schools have more points
      const schoolsAhead = await User.aggregate([
        {
          $match: {
            school_id: { $exists: true, $ne: null },
            active: { $ne: false },
          },
        },
        {
          $group: {
            _id: "$school_id",
            totalPoints: { $sum: "$points" },
          },
        },
        {
          $match: {
            totalPoints: { $gt: currentSchool.totalPoints },
          },
        },
        {
          $count: "count",
        },
      ]);

      const actualRank =
        schoolsAhead.length > 0 ? schoolsAhead[0].count + 1 : 1;

      leaderboard.push({
        rank: actualRank,
        name: currentSchool.name,
        city: currentSchool.city,
        totalPoints: currentSchool.totalPoints,
        studentCount: currentSchool.studentCount,
        isCurrentUserSchool: true,
      });
    }
  }

  res.status(200).json({
    status: "success",
    results: leaderboard.length,
    data: {
      leaderboard,
    },
  });
});
