const factory = require("./handlerFactory");
const Challenge = require("../models/challengeModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

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

exports.getChallenge = factory.getOne(Challenge);
exports.createChallenge = factory.createOne(Challenge);
exports.updateChallenge = factory.updateOne(Challenge);
exports.deleteChallenge = factory.deleteOne(Challenge);
