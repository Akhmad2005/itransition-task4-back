const express = require('express');
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');
const formatDate = require('../utilities/formatDate')

// Middleware для проверки авторизации
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
		const user = await User.findOne({userId: Number(decoded.id)});
    
		if (user && user.status == 'blocked') {
      return res.status(401).json({ message: 'User is blocked' });
    }
    req.user = decoded;
    next();
  });
};

// Получение списка пользователей
router.get('/', authMiddleware, async (req, res) => {
  try {
    let users = await User.find();
		let sentUsers = users.map(user => {
      let userObject = user.toObject();
      delete userObject.password;
      delete userObject.__v;
      delete userObject._id;
			userObject.registrationDate = formatDate(userObject?.registrationDate)
			userObject.lastLoginDate = formatDate(userObject?.lastLoginDate)
			
      return userObject;
    });
    res.json(sentUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Блокировка пользователей
router.post('/block', authMiddleware, async (req, res) => {
  const { userIds } = req.body;

  try {
    await User.updateMany({ userId: { $in: userIds } }, { $set: { status: 'blocked' } });
    res.json({ message: 'Users blocked' });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking users', error });
  }
});

// Разблокировка пользователей
router.post('/unblock', authMiddleware, async (req, res) => {
  const { userIds } = req.body;

  try {
    await User.updateMany({ userId: { $in: userIds } }, { $set: { status: 'active' } });
    res.json({ message: 'Users unblocked' });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking users', error });
  }
});

// Удаление пользователей
router.post('/delete', authMiddleware, async (req, res) => {
  const { userIds } = req.body;

  try {
    await User.deleteMany({ userId: { $in: userIds } });
    res.json({ message: 'Users deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting users', error });
  }
});

module.exports = router;
