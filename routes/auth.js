const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

async function getNextUserId() {
  const lastUser = await User.findOne({}, {}, { sort: { userId: -1 } });
  return lastUser && lastUser.userId ? lastUser.userId + 1 : 1;
}

// Регистрация
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
	const userId = await getNextUserId();

	if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userId,
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
		if (error?.code && error.code === 11000) {
			res.status(500).json({ message: 'Email was already registrated!' });
		} else {
			res.status(500).json({ message: 'Error registering user', error });
		}
  }
});

// Аутентификация
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.status === 'blocked') {
      return res.status(401).json({ message: 'User is blocked' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

		user.lastLoginDate = new Date();
    await user.save();

    const token = jwt.sign({ id: user.userId, status: user.status }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

module.exports = router;
