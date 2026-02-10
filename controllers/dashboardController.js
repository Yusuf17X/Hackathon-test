const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const Challenge = require('../models/challengeModel');
const UserChallenge = require('../models/userChallengeModel');

// GET /api/v1/dashboard/public - No authentication required
exports.getPublicDashboard = catchAsync(async (req, res, next) => {
  // 1. Get all approved challenges with populated challenge data
  const approvedChallenges = await UserChallenge.find({ status: 'approved' })
    .populate('challenge_id');

  // 2. Calculate total eco impact
  let totalImpact = {
    co2SavedKg: 0,
    co2AbsorbedKgPerYear: 0,
    waterSavedLiters: 0,
    plasticSavedGrams: 0,
    energySavedKwh: 0,
    treesEquivalent: 0,
  };

  approvedChallenges.forEach(uc => {
    if (uc.challenge_id && uc.challenge_id.ecoImpact) {
      const impact = uc.challenge_id.ecoImpact;
      totalImpact.co2SavedKg += impact.co2SavedKg || 0;
      totalImpact.co2AbsorbedKgPerYear += impact.co2AbsorbedKgPerYear || 0;
      totalImpact.waterSavedLiters += impact.waterSavedLiters || 0;
      totalImpact.plasticSavedGrams += impact.plasticSavedGrams || 0;
      totalImpact.energySavedKwh += impact.energySavedKwh || 0;
      totalImpact.treesEquivalent += impact.treesEquivalent || 0;
    }
  });

  // 3. Get counts
  const totalUsers = await User.countDocuments({ active: { $ne: false } });
  const totalSchools = await School.countDocuments();
  const totalChallenges = await Challenge.countDocuments({ isActive: true });
  const activeParticipants = new Set(approvedChallenges.map(uc => uc.user_id.toString())).size;

  // 4. Get top 5 schools by total points
  const topSchools = await User.aggregate([
    { $match: { school_id: { $exists: true, $ne: null }, active: { $ne: false } } },
    { $group: { _id: '$school_id', totalPoints: { $sum: '$points' }, studentCount: { $sum: 1 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'schools', localField: '_id', foreignField: '_id', as: 'school' } },
    { $unwind: '$school' },
    { $project: { _id: 1, name: '$school.name', city: '$school.city', totalPoints: 1, studentCount: 1 } },
  ]);

  // 5. Return response
  res.status(200).json({
    status: 'success',
    data: {
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
        totalUsers,
        activeParticipants,
        totalSchools,
        totalChallengesAvailable: totalChallenges,
        totalChallengesCompleted: approvedChallenges.length,
      },
      topSchools: topSchools.map((s, index) => ({
        rank: index + 1,
        name: s.name,
        city: s.city,
        totalPoints: s.totalPoints,
        studentCount: s.studentCount,
      })),
    },
  });
});
