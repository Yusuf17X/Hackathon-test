const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("@exortek/express-mongo-sanitize");
const hpp = require("hpp");
const inputSanitizer = require("./utils/inputSanitizer");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const schoolRouter = require("./routes/schoolRoutes");
const badgeRouter = require("./routes/badgeRoutes");
const challengeRouter = require("./routes/challengeRoutes");
const userChallengeRouter = require("./routes/userChallengeRoutes");
const userBadgeRouter = require("./routes/userBadgeRoutes");
const dashboardRouter = require("./routes/dashboardRoutes");
const appError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.enable("trust proxy");

app.use(cors());
app.options("*", cors());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request. Please try again later!",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Sanitization against XSS
//! NEEDS REVIEW AFTER AI
// escape all HTML in body/params:
app.use(inputSanitizer({ mode: "escape" }));
// OR strip tags completely:
// app.use(inputSanitizer({ mode: 'strip' }));

// HTTP Parameter Pollution protection
app.use(
  hpp({
    whitelist: ["year", "ratingAverage", "duration", "releaseDate"],
  }),
);

app.use(compression());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/schools", schoolRouter);
app.use("/api/v1/badges", badgeRouter);
app.use("/api/v1/challenges", challengeRouter);
app.use("/api/v1/user-challenges", userChallengeRouter);
app.use("/api/v1/user-badges", userBadgeRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.all("*/splat", (req, res, next) => {
  next(new appError(`Cant find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
