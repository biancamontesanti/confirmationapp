import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { hashPassword, comparePassword, generateToken } from '../auth';
import Host from '../models/Host';

const router = express.Router();

// Register host
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await Host.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newHost = new Host({
      email,
      password: hashedPassword
    });

    const savedHost = await newHost.save();
    const token = generateToken((savedHost._id as any).toString(), savedHost.email, name);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: savedHost._id, email: savedHost.email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login host
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await Host.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken((user._id as any).toString(), user.email, email);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;