const express = require('express');
const debugController = require('../controllers/debugController');

const router = express.Router();

router.get('/logs', debugController.getLogs);

module.exports = router;
