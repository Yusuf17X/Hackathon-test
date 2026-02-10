# Dev Data - Test Data Generator and Seeder

This folder contains test data and a seeder script to populate the database with sample data for development and testing purposes.

## 📁 Contents

- **JSON Data Files**: Pre-generated test data for all models
  - `users.json` - 102 user records (including admin, creator, editor, and regular users)
  - `schools.json` - 10 school records (with Arabic and English names)
  - `challenges.json` - 42 challenge records (mix of 'solo' and 'school_task' types)
  - `badges.json` - 10 badge records (various achievement types)
  - `userChallenges.json` - 10 user challenge submission records
  - `userBadges.json` - 10 user badge achievement records

- **import-dev-data.js**: Node.js seeder script for managing test data

## 🚀 Quickstart

### Prerequisites

Make sure you have:
1. MongoDB running (locally or remote)
2. `MONGODB_URI` set in `config.env` file in the project root

### Import Test Data

To import all test data into the database:

```bash
node dev-data/import-dev-data.js --import
```

This will:
1. Connect to the database using `MONGODB_URI` from `config.env`
2. Delete all existing data from all collections
3. Import fresh test data from all JSON files
4. Display a summary of imported records

### Delete All Data

To delete all data from the database:

```bash
node dev-data/import-dev-data.js --delete
```

This will remove all records from:
- Users
- Schools
- Challenges
- Badges
- User Challenges
- User Badges

### Using a Custom MongoDB URI

You can also provide a MongoDB URI directly as a command line argument:

```bash
node dev-data/import-dev-data.js --import mongodb://localhost:27017/hackathon-db
```

## 📊 Test Data Details

### Users (102 records)
- **Roles**: 2 admins, 8 creators, 10 editors, 82 regular users
- **Password**: All users have password `password123` (pre-hashed)
- **Email**: Format `user{n}@example.com` (e.g., user1@example.com)
- **Schools**: Distributed across all 10 schools
- **Points**: Random between 0-500
- **Names**: Mix of Arabic and English names

### Schools (10 records)
- Mix of Arabic and English school names
- Located in various Saudi cities: Riyadh, Jeddah, Dammam, Mecca, Medina, Khobar, Abha, Taif, Jubail

### Challenges (42 records)
- **Types**: 
  - `solo` - Individual challenges (e.g., plant a tree, recycle plastic)
  - `school_task` - School-based challenges (e.g., beach cleanup, green school campaign)
- **Points**: Range from 20-65 points
- **Content**: Mix of environmental challenges in Arabic and English
- **Topics**: Recycling, water conservation, energy saving, biodiversity, climate change, etc.

### Badges (10 records)
- **Requirement Types**:
  - `challenges_count` - Earn by completing X challenges
  - `points_threshold` - Earn by reaching X points
  - `specific_challenge` - Earn by completing a specific challenge
- Mix of Arabic and English badge names

### User Challenges (10 records)
- **Statuses**: 
  - `approved` - Challenge verified and approved
  - `processing` - Pending review
  - `rejected` - Challenge rejected
- Each has a proof URL (example URLs)

### User Badges (10 records)
- Links users to their earned badges

## 🔧 Usage Examples

### Full Database Reset with New Data
```bash
# Delete all data and import fresh test data
node dev-data/import-dev-data.js --import
```

### Clean Database
```bash
# Remove all test data
node dev-data/import-dev-data.js --delete
```

### Use with Docker/Cloud MongoDB
```bash
# Connect to a remote MongoDB instance
node dev-data/import-dev-data.js --import "mongodb+srv://user:password@cluster.mongodb.net/dbname"
```

## ⚠️ Important Notes

1. **Data Loss Warning**: The `--import` command will DELETE all existing data before importing. Use with caution in production environments.

2. **Password Hash**: All test users share the same password hash. In a real application, users should have unique, securely hashed passwords.

3. **Object IDs**: JSON files contain pre-generated MongoDB ObjectIDs to maintain referential integrity between collections.

4. **Challenge Types**: Remember that challenges now have a `challenge_type` field which can be either 'solo' or 'school_task'.

5. **User Challenge Status**: The status flow is:
   - User submits → `processing`
   - Teacher/Admin reviews → `approved` or `rejected`

## 🎯 Testing Scenarios

This test data supports various testing scenarios:

- **User Authentication**: Test login with any user (password: `password123`)
- **Role-Based Access**: Test different permission levels (admin, creator, editor, user)
- **School Leaderboards**: Multiple schools with distributed users
- **Challenge Completion**: Various challenge types and submission statuses
- **Badge Achievements**: Different badge requirement types
- **Multi-language Support**: Arabic and English content

## 📝 Customization

To modify the test data:

1. Edit the JSON files directly with your custom data
2. Ensure MongoDB ObjectID format is maintained for `_id` fields
3. Maintain referential integrity (e.g., user's `school_id` must exist in schools.json)
4. Run the import script to load your custom data

## 🐛 Troubleshooting

**Database Connection Failed**
- Check if MongoDB is running
- Verify `MONGODB_URI` in `config.env` is correct
- Ensure network connectivity to remote MongoDB instances

**Import Errors**
- Verify JSON files are valid (no syntax errors)
- Check that all referenced IDs exist in their respective collections
- Ensure required fields are present in all records

**Permission Errors**
- Make sure the database user has write permissions
- Check if the database allows deletion operations

## 📚 Related Documentation

For more information about the models and schemas, see:
- `/models/userModel.js`
- `/models/schoolModel.js`
- `/models/challengeModel.js`
- `/models/badgeModel.js`
- `/models/userChallengeModel.js`
- `/models/userBadgeModel.js`
