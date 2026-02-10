const factory = require("./handlerFactory");
const Challenge = require("../models/challengeModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

// GET /api/v1/challenges - Get only active challenges with filters
exports.getActiveChallenges = catchAsync(async (req, res, next) => {
  // Build filter for active challenges
  const filter = { isActive: true };

  // Add challenge_type filter if provided
  if (req.query.challenge_type) {
    filter.challenge_type = req.query.challenge_type;
  }

  // Set default sort if not provided
  // Note: "-points,-createdAt" means descending by points, then descending by createdAt (newest first)
  const queryString = { ...req.query };
  if (!queryString.sort) {
    queryString.sort = "-points,-createdAt";
  }

  // Set default pagination values
  if (!queryString.limit) {
    queryString.limit = "20";
  }
  if (!queryString.page) {
    queryString.page = "1";
  }

  // Apply API features with filtering, sorting, and pagination
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

exports.getAllChallenges = factory.getAll(Challenge);
exports.getChallenge = factory.getOne(Challenge);
exports.createChallenge = factory.createOne(Challenge);
exports.updateChallenge = factory.updateOne(Challenge);
exports.deleteChallenge = factory.deleteOne(Challenge);
