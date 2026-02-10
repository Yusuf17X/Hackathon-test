const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const School = require("../models/schoolModel");
const User = require("../models/userModel");
const UserChallenge = require("../models/userChallengeModel");
const { calculateTotalImpact } = require("../utils/ecoImpact");

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

// GET /api/v1/schools/:id/eco-stats
exports.getSchoolEcoStats = catchAsync(async (req, res, next) => {
  // 1. Get the school
  const school = await School.findById(req.params.id);
  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // 2. Get all users in this school
  const schoolUsers = await User.find({ school_id: req.params.id });
  const userIds = schoolUsers.map(u => u._id);

  // 3. Get all approved challenges for these users
  const approvedChallenges = await UserChallenge.find({
    user_id: { $in: userIds },
    status: 'approved'
  }).populate('challenge_id');

  // 4. Calculate total eco impact using utility function
  const totalImpact = calculateTotalImpact(approvedChallenges);

  // 5. Calculate participation stats
  const activeStudents = new Set(approvedChallenges.map(uc => uc.user_id.toString())).size;
  const totalPoints = schoolUsers.reduce((sum, u) => sum + (u.points || 0), 0);

  // 6. Return response
  res.status(200).json({
    status: 'success',
    data: {
      school: {
        id: school._id,
        name: school.name,
        city: school.city,
      },
      ecoImpact: {
        co2SavedKg: Math.round(totalImpact.co2SavedKg * 100) / 100,
        co2AbsorbedKgPerYear: Math.round(totalImpact.co2AbsorbedKgPerYear * 100) / 100,
        totalCo2Impact: Math.round((totalImpact.co2SavedKg + totalImpact.co2AbsorbedKgPerYear) * 100) / 100,
        waterSavedLiters: Math.round(totalImpact.waterSavedLiters * 100) / 100,
        plasticSavedGrams: Math.round(totalImpact.plasticSavedGrams),
        plasticSavedKg: Math.round(totalImpact.plasticSavedGrams / 10) / 100,
        energySavedKwh: Math.round(totalImpact.energySavedKwh * 100) / 100,
        treesEquivalent: Math.round(totalImpact.treesEquivalent * 100) / 100,
      },
      participation: {
        totalStudents: schoolUsers.length,
        activeStudents,
        participationRate: schoolUsers.length > 0 
          ? Math.round((activeStudents / schoolUsers.length) * 100) + '%' 
          : '0%',
        totalChallengesCompleted: approvedChallenges.length,
        totalPoints,
      },
    },
  });
});
