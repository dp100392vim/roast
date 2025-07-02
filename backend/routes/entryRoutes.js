const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');

router.post('/add', entryController.add);
router.get('/names', entryController.names);
router.get('/recommends', entryController.getRecommendations );

module.exports = router;