const factory = require("./handlerFactory");
const Challenge = require("../models/challengeModel");
const UserChallenge = require("../models/userChallengeModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const challengeScheduler = require("../utils/challengeScheduler");

exports.getAllChallenges = catchAsync(async (req, res, next) => {
  // Build filter for isActive: true
  const filter = { isActive: true };

  // Add optional challenge_type filter if provided
  if (req.query.challenge_type) {
    filter.challenge_type = req.query.challenge_type;
  }

  // Set pagination defaults
  const queryString = {
    ...req.query,
    limit: req.query.limit || 20,
    page: req.query.page || 1,
  };

  // Use APIFeatures for filtering, sorting, field limiting, and pagination
  const features = new APIFeatures(Challenge.find(filter), queryString)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const challenges = await features.query;

  res.status(200).json({
    status: "success",
    results: challenges.length,
    data: {
      challenges,
    },
  });
});

/**
 * Get available challenges for the authenticated user
 * Returns daily and weekly challenges with their completion status
 * Filters based on UTC day/week boundaries
 */
exports.getAvailableChallenges = catchAsync(async (req, res, next) => {
  // Get all active challenges
  const challenges = await Challenge.find({ isActive: true });

  // Get user's challenge submissions
  const userChallenges = await UserChallenge.find({
    user_id: req.user._id,
  });

  // Get challenges with completion status based on UTC boundaries
  const challengesWithStatus = challengeScheduler.getChallengesWithStatus(
    challenges,
    userChallenges
  );

  // Separate by frequency
  const dailyChallenges = challengesWithStatus.filter(
    (c) => c.frequency === "daily"
  );
  const weeklyChallenges = challengesWithStatus.filter(
    (c) => c.frequency === "weekly"
  );
  const oneTimeChallenges = challengesWithStatus.filter(
    (c) => c.frequency === "one-time"
  );

  res.status(200).json({
    status: "success",
    data: {
      daily: dailyChallenges,
      weekly: weeklyChallenges,
      oneTime: oneTimeChallenges,
      all: challengesWithStatus,
    },
  });
});

exports.getChallenge = factory.getOne(Challenge);
exports.createChallenge = factory.createOne(Challenge);
exports.updateChallenge = factory.updateOne(Challenge);
exports.deleteChallenge = factory.deleteOne(Challenge);
