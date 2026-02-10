/**
 * Challenge Scheduler Utility
 * Handles UTC-based daily and weekly challenge reset logic
 * Daily challenges reset at midnight UTC
 * Weekly challenges reset at Sunday midnight UTC
 */

// Time constants in milliseconds
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the start of current UTC day
 * @returns {Date} Start of current UTC day (midnight UTC)
 */
const getUTCDayStart = () => {
  const now = new Date();
  const utcDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  return utcDay;
};

/**
 * Get the start of current UTC week (Sunday midnight UTC)
 * @returns {Date} Start of current UTC week
 */
const getUTCWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const utcWeekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - dayOfWeek,
      0,
      0,
      0,
      0
    )
  );
  return utcWeekStart;
};

/**
 * Check if a date is within the current UTC day
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is within current UTC day
 */
const isWithinCurrentUTCDay = (date) => {
  if (!date) return false;
  const dayStart = getUTCDayStart();
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
  return date >= dayStart && date < dayEnd;
};

/**
 * Check if a date is within the current UTC week
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is within current UTC week
 */
const isWithinCurrentUTCWeek = (date) => {
  if (!date) return false;
  const weekStart = getUTCWeekStart();
  const weekEnd = new Date(weekStart.getTime() + MS_PER_WEEK);
  return date >= weekStart && date < weekEnd;
};

/**
 * Check if a challenge is available for a user based on frequency and completion status
 * @param {Object} challenge - Challenge object with frequency field
 * @param {Date|null} lastCompletionDate - Last date user completed this challenge (from UserChallenge)
 * @returns {boolean} True if challenge is available for the user
 */
const isChallengeAvailable = (challenge, lastCompletionDate) => {
  if (!challenge || !challenge.frequency) return false;

  switch (challenge.frequency) {
    case "daily":
      // Available if never completed OR last completion was before current UTC day
      if (!lastCompletionDate) return true;
      return !isWithinCurrentUTCDay(lastCompletionDate);

    case "weekly":
      // Available if never completed OR last completion was before current UTC week
      if (!lastCompletionDate) return true;
      return !isWithinCurrentUTCWeek(lastCompletionDate);

    case "one-time":
      // Available only if never completed
      return !lastCompletionDate;

    default:
      return false;
  }
};

/**
 * Filter challenges by availability for a specific user
 * @param {Array} challenges - Array of challenge objects
 * @param {Array} userChallenges - Array of user's completed challenges (status: 'approved')
 * @returns {Array} Array of available challenges with completion info
 */
const getAvailableChallenges = (challenges, userChallenges) => {
  // Create a map of challenge completions by challenge ID
  const completionMap = {};
  userChallenges.forEach((uc) => {
    const challengeId = uc.challenge_id.toString();
    // Only consider approved challenges
    if (uc.status === "approved") {
      // For recurring challenges, keep the most recent completion
      if (!completionMap[challengeId] || uc.createdAt > completionMap[challengeId]) {
        completionMap[challengeId] = uc.createdAt;
      }
    }
  });

  // Filter and map challenges with availability info
  return challenges
    .filter((challenge) => {
      const lastCompletion = completionMap[challenge._id.toString()];
      return isChallengeAvailable(challenge, lastCompletion);
    })
    .map((challenge) => {
      const lastCompletion = completionMap[challenge._id.toString()];
      return {
        ...challenge.toObject(),
        lastCompletedAt: lastCompletion || null,
        completedToday: lastCompletion ? isWithinCurrentUTCDay(lastCompletion) : false,
        completedThisWeek: lastCompletion ? isWithinCurrentUTCWeek(lastCompletion) : false,
      };
    });
};

/**
 * Get challenges with completion status for a user
 * @param {Array} challenges - Array of challenge objects
 * @param {Array} userChallenges - Array of user's challenges
 * @returns {Array} Array of challenges with completion status
 */
const getChallengesWithStatus = (challenges, userChallenges) => {
  // Create a map of challenge completions by challenge ID
  const completionMap = {};
  const pendingMap = {};
  
  userChallenges.forEach((uc) => {
    const challengeId = uc.challenge_id.toString();
    
    if (uc.status === "approved") {
      // For recurring challenges, keep the most recent completion
      if (!completionMap[challengeId] || uc.createdAt > completionMap[challengeId]) {
        completionMap[challengeId] = uc.createdAt;
      }
    } else if (uc.status === "pending") {
      // Track pending submissions
      if (!pendingMap[challengeId] || uc.createdAt > pendingMap[challengeId]) {
        pendingMap[challengeId] = uc.createdAt;
      }
    }
  });

  // Map all challenges with their status
  return challenges.map((challenge) => {
    const challengeId = challenge._id.toString();
    const lastCompletion = completionMap[challengeId];
    const lastPending = pendingMap[challengeId];
    
    const completedToday = lastCompletion ? isWithinCurrentUTCDay(lastCompletion) : false;
    const completedThisWeek = lastCompletion ? isWithinCurrentUTCWeek(lastCompletion) : false;
    
    let isAvailable = isChallengeAvailable(challenge, lastCompletion);
    let status = "available";
    
    if (lastPending) {
      status = "pending";
      isAvailable = false;
    } else if (lastCompletion) {
      if (challenge.frequency === "one-time") {
        status = "completed";
        isAvailable = false;
      } else if (challenge.frequency === "daily" && completedToday) {
        status = "completed_today";
        isAvailable = false;
      } else if (challenge.frequency === "weekly" && completedThisWeek) {
        status = "completed_this_week";
        isAvailable = false;
      }
    }
    
    return {
      ...challenge.toObject(),
      isAvailable,
      status,
      lastCompletedAt: lastCompletion || null,
      completedToday,
      completedThisWeek,
    };
  });
};

module.exports = {
  MS_PER_DAY,
  MS_PER_WEEK,
  getUTCDayStart,
  getUTCWeekStart,
  isWithinCurrentUTCDay,
  isWithinCurrentUTCWeek,
  isChallengeAvailable,
  getAvailableChallenges,
  getChallengesWithStatus,
};
