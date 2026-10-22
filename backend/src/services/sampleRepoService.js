const path = require('path');
const fs = require('fs');

/**
 * Creates realistic sample repositories on disk with actual AST code structures,
 * routes, models, circular dependencies, and dead code.
 */
class SampleRepoService {
  async ensureSampleRepos(baseDir) {
    const samplesDir = path.join(baseDir, 'data', 'samples');
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    const ecommerceDir = path.join(samplesDir, 'ecommerce-api');
    if (!fs.existsSync(ecommerceDir)) {
      this.createEcommerceSample(ecommerceDir);
    }

    return [
      {
        id: 'sample-ecommerce-api',
        name: 'ecommerce-payment-api',
        description: 'Express REST API with JWT Auth, Stripe checkout, MongoDB models, and dependency cycles',
        path: ecommerceDir,
        stars: 342,
        language: 'JavaScript',
      },
    ];
  }

  createEcommerceSample(rootDir) {
    fs.mkdirSync(rootDir, { recursive: true });

    const files = {
      'package.json': JSON.stringify(
        {
          name: 'ecommerce-payment-api',
          version: '1.0.0',
          main: 'src/server.js',
          dependencies: {
            express: '^4.18.2',
            jsonwebtoken: '^9.0.2',
            bcrypt: '^5.1.1',
            mongoose: '^8.0.0',
            stripe: '^14.0.0',
          },
        },
        null,
        2
      ),
      'src/server.js': `const express = require('express');
const authRouter = require('./routes/authRoutes');
const orderRouter = require('./routes/orderRoutes');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

// Initialize database
connectDB();

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', orderRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Ecommerce API listening on port ' + PORT);
});
`,
      'src/config/database.js': `const mongoose = require('mongoose');

/**
 * Connect to primary database cluster
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shop');
    console.log('MongoDB Connected successfully');
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

module.exports = { connectDB };
`,
      'src/models/User.js': `class User {
  /**
   * User model representing customer account
   */
  constructor(id, email, passwordHash, role = 'customer') {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
  }

  static async findByEmail(email) {
    // Database query simulation
    return new User('usr_101', email, '$2b$10$hashedPasswordHere', 'customer');
  }

  static async create(userData) {
    return new User('usr_' + Date.now(), userData.email, userData.hash);
  }
}

module.exports = { User };
`,
      'src/models/Order.js': `class Order {
  /**
   * Order model for transaction records
   */
  constructor(orderId, userId, amount, status = 'PENDING') {
    this.orderId = orderId;
    this.userId = userId;
    this.amount = amount;
    this.status = status;
    this.createdAt = new Date();
  }

  static async createOrder(userId, amount) {
    return new Order('ord_' + Date.now(), userId, amount, 'PENDING');
  }

  async markPaid(transactionId) {
    this.status = 'PAID';
    this.transactionId = transactionId;
    return this;
  }
}

module.exports = { Order };
`,
      'src/utils/security.js': `const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Validates plain password against stored bcrypt hash
 */
const validatePassword = async (plainPassword, hash) => {
  return await bcrypt.compare(plainPassword, hash);
};

/**
 * Generates signed JWT authentication token
 */
const generateAuthToken = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, 'SECRET_KEY_123', { expiresIn: '24h' });
};

/**
 * UNUSED DEAD CODE: Legacy hash function preserved from v1
 */
const legacyEncryptToken = (rawString) => {
  return Buffer.from(rawString).toString('base64');
};

module.exports = {
  validatePassword,
  generateAuthToken,
  legacyEncryptToken,
};
`,
      'src/controllers/authController.js': `const { User } = require('../models/User');
const { validatePassword, generateAuthToken } = require('../utils/security');

/**
 * Handles customer login verification and token issuance
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await validatePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateAuthToken(user);
  res.json({ token, user: { id: user.id, email: user.email } });
};

/**
 * Registers a new customer account
 */
const register = async (req, res) => {
  const { email, password } = req.body;
  const newUser = await User.create({ email, hash: 'hashed_' + password });
  const token = generateAuthToken(newUser);
  res.status(201).json({ token, user: newUser });
};

module.exports = {
  login,
  register,
};
`,
      'src/routes/authRoutes.js': `const express = require('express');
const { login, register } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

module.exports = router;
`,
      // NOTE: orderService and paymentService introduce an intentional circular dependency
      // for CodeGraph's circular dependency detector to catch!
      'src/services/orderService.js': `const { Order } = require('../models/Order');
const { processPayment } = require('./paymentService'); // Cycle: order -> payment -> order

/**
 * Core order checkout orchestration
 */
const checkoutOrder = async (userId, amount, paymentMethod) => {
  const order = await Order.createOrder(userId, amount);
  const paymentResult = await processPayment(order.orderId, amount, paymentMethod);

  if (paymentResult.success) {
    await order.markPaid(paymentResult.txId);
  }
  return order;
};

const cancelOrderRefund = async (orderId) => {
  console.log('Order canceled: ' + orderId);
};

module.exports = {
  checkoutOrder,
  cancelOrderRefund,
};
`,
      'src/services/paymentService.js': `const { cancelOrderRefund } = require('./orderService'); // Cycle: payment -> order

/**
 * Executes payment gateway processing
 */
const processPayment = async (orderId, amount, paymentMethod) => {
  try {
    if (amount <= 0) {
      await cancelOrderRefund(orderId);
      return { success: false, reason: 'Invalid amount' };
    }
    return { success: true, txId: 'tx_' + Math.random().toString(36).substr(2, 9) };
  } catch (err) {
    await cancelOrderRefund(orderId);
    throw err;
  }
};

module.exports = {
  processPayment,
};
`,
      'src/controllers/orderController.js': `const { checkoutOrder } = require('../services/orderService');

/**
 * API handler to initiate order checkout and payment
 */
const createCheckout = async (req, res) => {
  const { userId, amount, paymentMethod } = req.body;
  const order = await checkoutOrder(userId, amount, paymentMethod);
  res.status(200).json({ success: true, order });
};

module.exports = {
  createCheckout,
};
`,
      'src/routes/orderRoutes.js': `const express = require('express');
const { createCheckout } = require('../controllers/orderController');

const router = express.Router();

router.post('/checkout', createCheckout);

module.exports = router;
`,
      'src/middleware/errorHandler.js': `/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
};

module.exports = { errorHandler };
`,
    };

    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = path.join(rootDir, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

module.exports = new SampleRepoService();
