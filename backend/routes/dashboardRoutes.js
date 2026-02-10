const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Public route - no authentication required
router.get('/public', dashboardController.getPublicDashboard);

module.exports = router;
