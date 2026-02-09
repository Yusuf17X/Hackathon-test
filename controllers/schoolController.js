const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const School = require("../models/schoolModel");

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
