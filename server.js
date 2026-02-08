const mongoose = require("mongoose");
const dotenv = require("dotenv");

// FOr sync errors like using undefined variable
process.on("uncaughtException", (err) => {
  console.log(`Unhandled Exception! 💥 Shutting down...`);
  console.log(err.name, err.message, err);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DB.replace(
  "<DATABASE_PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then((con) => console.log("DB Connected!"));

const server = app.listen(3000, () => {
  console.log("Started listening...");
});

//For async errors like failed auth to the db
process.on("unhandledRejection", (err) => {
  console.log(`Unhandled Rejection! 💥 Shutting down...`);
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});
