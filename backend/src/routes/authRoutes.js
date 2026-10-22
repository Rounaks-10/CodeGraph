const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { UserModel, memoryUsers } = require('../models/User');
const { JWT_SECRET, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const isMongooseConnected = () => mongoose.connection.readyState === 1;

const path = require('path');
const storeService = require('../services/storeService');
const sampleRepoService = require('../services/sampleRepoService');
const ingestionService = require('../services/ingestionService');

// Helper: Seed demo account if not exists
const ensureDemoUser = async () => {
  const demoEmail = 'demo@codegraph.dev';
  const hashedPassword = await bcrypt.hash('codegraph123', 10);
  const demoUser = {
    _id: 'demo-user-id-001',
    id: 'demo-user-id-001',
    name: 'Demo Developer',
    email: demoEmail,
    password: hashedPassword,
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=DemoDev',
    role: 'developer',
    createdAt: new Date(),
  };

  memoryUsers.set(demoEmail, demoUser);

  if (isMongooseConnected()) {
    try {
      const exists = await UserModel.findOne({ email: demoEmail });
      if (!exists) {
        await new UserModel(demoUser).save();
      }
    } catch (_) {}
  }

  // Ensure demo user has the ecommerce-payment-api sample repo
  try {
    const demoRepos = await storeService.listRepos('demo-user-id-001');
    if (demoRepos.length === 0) {
      const baseDir = path.join(__dirname, '..', '..');
      const samples = await sampleRepoService.ensureSampleRepos(baseDir);
      const storageDir = path.join(baseDir, 'data', 'repositories');
      if (samples.length > 0) {
        await ingestionService.ingestSample(samples[0], storageDir, 'demo-user-id-001');
      }
    }
  } catch (err) {
    console.warn('Note on demo repo seeding:', err.message);
  }
};

// Routes are defined below — exports happen at the bottom of this file.

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    let existingUser = memoryUsers.get(cleanEmail);
    if (!existingUser && isMongooseConnected()) {
      try {
        existingUser = await UserModel.findOne({ email: cleanEmail }).lean();
      } catch (_) {}
    }

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`;

    const newUser = {
      _id: userId,
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      avatar,
      role: 'developer',
      createdAt: new Date(),
    };

    memoryUsers.set(cleanEmail, newUser);

    if (isMongooseConnected()) {
      try {
        const userDoc = new UserModel(newUser);
        await userDoc.save();
      } catch (err) {
        console.warn('MongoDB user save warning:', err.message);
      }
    }

    const token = jwt.sign(
      { id: userId, email: cleanEmail, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: cleanEmail,
        avatar,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = memoryUsers.get(cleanEmail);
    if (!user && isMongooseConnected()) {
      try {
        user = await UserModel.findOne({ email: cleanEmail }).lean();
      } catch (_) {}
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id || user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.name)}`,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current User (Session check)
router.get('/me', requireAuth, async (req, res) => {
  try {
    let user = memoryUsers.get(req.user.email);
    if (!user && isMongooseConnected()) {
      try {
        user = await UserModel.findById(req.user.id).lean();
      } catch (_) {}
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.name)}`,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Named exports so server.js can call ensureDemoUser after DB connects
module.exports = router;
module.exports.ensureDemoUser = ensureDemoUser;
