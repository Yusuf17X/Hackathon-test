const catchAsync = require('../utils/catchAsync');
const UserChallenge = require('../models/userChallengeModel');
const { calculateTotalImpact } = require('../utils/ecoImpact');

// GET /api/v1/dashboard/public - No authentication required
exports.getPublicDashboard = catchAsync(async (req, res, next) => {
  // 1. Get all approved challenges with populated challenge data
  const approvedChallenges = await UserChallenge.find({ status: 'approved' })
    .populate('challenge_id');

  // 2. Calculate total eco impact using utility function
  const totalImpact = calculateTotalImpact(approvedChallenges);

  // 3. Return response with only eco impact data
  res.status(200).json({
    status: 'success',
    data: {
      ecoImpact: {
        co2SavedKg: Math.round(totalImpact.co2SavedKg * 100) / 100,
        co2AbsorbedKgPerYear: Math.round(totalImpact.co2AbsorbedKgPerYear * 100) / 100,
        waterSavedLiters: Math.round(totalImpact.waterSavedLiters * 100) / 100,
        plasticSavedGrams: Math.round(totalImpact.plasticSavedGrams),
        energySavedKwh: Math.round(totalImpact.energySavedKwh * 100) / 100,
        treesEquivalent: Math.round(totalImpact.treesEquivalent * 100) / 100,
        totalChallengesCompleted: approvedChallenges.length,
      },
    },
  });
});
