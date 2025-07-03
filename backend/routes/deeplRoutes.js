const express = require('express');
const router = express.Router();
const deeplController = require('../controllers/deeplController');

router.post('/translate', deeplController.translate);

module.exports = router;