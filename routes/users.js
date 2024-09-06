// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password,age,contact,gender,dob } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword,age,dob,contact,gender });
    await newUser.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  // console.log('Token received:', token); 
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // console.log('User data:', user);
    user.dob = user.dob ? user.dob.toISOString().split('T')[0] : '';
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});


router.put('/update', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const { username, email, age, dob, contact, gender, password } = req.body;

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (age) updateFields.age = age;
    if (dob) updateFields.dob = dob;
    if (contact) updateFields.contact = contact;
    if (gender) updateFields.gender = gender;
    
    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await User.findByIdAndUpdate(decoded.id, updateFields, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    updatedUser.dob = updatedUser.dob ? updatedUser.dob.toISOString().split('T')[0] : '';
    
    res.json(updatedUser);
  } catch (err) {
    console.log('Error during user update:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
});


module.exports = router;
