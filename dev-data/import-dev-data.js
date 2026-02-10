const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const User = require('./../models/userModel');
const School = require('./../models/schoolModel');
const Challenge = require('./../models/challengeModel');
const Badge = require('./../models/badgeModel');
const UserChallenge = require('./../models/userChallengeModel');
const UserBadge = require('./../models/userBadgeModel');

// Get MongoDB URI from environment or command line argument
// Support both MONGODB_URI and DB environment variables
let DB = process.env.MONGODB_URI || process.env.DB || process.argv[3];

// Replace DATABASE_PASSWORD placeholder if needed
if (DB && process.env.DATABASE_PASSWORD) {
  DB = DB.replace('<DATABASE_PASSWORD>', process.env.DATABASE_PASSWORD);
}

if (!DB) {
  console.error('❌ Error: Database connection string is required!');
  console.log('Usage:');
  console.log('  node import-dev-data.js --import');
  console.log('  node import-dev-data.js --delete');
  console.log('  node import-dev-data.js --import <MONGODB_URI>');
  console.log('\nMake sure MONGODB_URI or DB is set in config.env');
  process.exit(1);
}

// Connect to database
mongoose
  .connect(DB)
  .then(() => console.log('✅ DB connection successful!'))
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });

// Read JSON files
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const schools = JSON.parse(
  fs.readFileSync(`${__dirname}/schools.json`, 'utf-8'),
);
const challenges = JSON.parse(
  fs.readFileSync(`${__dirname}/challenges.json`, 'utf-8'),
);
const badges = JSON.parse(fs.readFileSync(`${__dirname}/badges.json`, 'utf-8'));
const userChallenges = JSON.parse(
  fs.readFileSync(`${__dirname}/userChallenges.json`, 'utf-8'),
);
const userBadges = JSON.parse(
  fs.readFileSync(`${__dirname}/userBadges.json`, 'utf-8'),
);

// Import data into database
const importData = async () => {
  try {
    console.log('\n🔄 Starting data import...\n');

    // Delete existing data first
    await User.deleteMany();
    await School.deleteMany();
    await Challenge.deleteMany();
    await Badge.deleteMany();
    await UserChallenge.deleteMany();
    await UserBadge.deleteMany();
    console.log('✅ Existing data deleted\n');

    // Import new data
    const importedSchools = await School.insertMany(schools);
    console.log(`✅ ${importedSchools.length} schools imported`);

    const importedChallenges = await Challenge.insertMany(challenges);
    console.log(`✅ ${importedChallenges.length} challenges imported`);

    const importedBadges = await Badge.insertMany(badges);
    console.log(`✅ ${importedBadges.length} badges imported`);

    // For users, we need to disable password validation
    const importedUsers = await User.insertMany(users, {
      validateBeforeSave: false,
    });
    console.log(`✅ ${importedUsers.length} users imported`);

    const importedUserChallenges =
      await UserChallenge.insertMany(userChallenges);
    console.log(`✅ ${importedUserChallenges.length} user challenges imported`);

    const importedUserBadges = await UserBadge.insertMany(userBadges);
    console.log(`✅ ${importedUserBadges.length} user badges imported`);

    console.log('\n🎉 Data successfully imported!\n');
    console.log('Summary:');
    console.log(`  • ${importedSchools.length} schools`);
    console.log(`  • ${importedChallenges.length} challenges`);
    console.log(`  • ${importedBadges.length} badges`);
    console.log(`  • ${importedUsers.length} users`);
    console.log(`  • ${importedUserChallenges.length} user challenges`);
    console.log(`  • ${importedUserBadges.length} user badges`);
    console.log(`  • Total: ${importedSchools.length + importedChallenges.length + importedBadges.length + importedUsers.length + importedUserChallenges.length + importedUserBadges.length} records\n`);
  } catch (err) {
    console.error('❌ Error importing data:', err.message);
    console.error(err);
  }
  process.exit();
};

// Delete all data from database
const deleteData = async () => {
  try {
    console.log('\n🔄 Starting data deletion...\n');

    await User.deleteMany();
    console.log('✅ Users deleted');

    await School.deleteMany();
    console.log('✅ Schools deleted');

    await Challenge.deleteMany();
    console.log('✅ Challenges deleted');

    await Badge.deleteMany();
    console.log('✅ Badges deleted');

    await UserChallenge.deleteMany();
    console.log('✅ User challenges deleted');

    await UserBadge.deleteMany();
    console.log('✅ User badges deleted');

    console.log('\n🎉 All data successfully deleted!\n');
  } catch (err) {
    console.error('❌ Error deleting data:', err.message);
  }
  process.exit();
};

// Check command line arguments
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  console.log('❌ Invalid command!');
  console.log('\nUsage:');
  console.log('  node import-dev-data.js --import');
  console.log('  node import-dev-data.js --delete');
  console.log('  node import-dev-data.js --import <MONGODB_URI>');
  console.log('\nExamples:');
  console.log(
    '  node import-dev-data.js --import mongodb://localhost:27017/mydb',
  );
  console.log('  node import-dev-data.js --delete\n');
  process.exit(1);
}
