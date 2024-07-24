const express = require('express');
const authController = require('../controllers/AuthController');

const router = express.Router();

router.post('/signup', authController.SignUp);
router.post('/signin', authController.SignIn);
router.post('/verify', authController.Verify);
router.get('/getUsers', authController.getUsers);

module.exports = router;