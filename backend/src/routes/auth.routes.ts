/**
 * Auth Routes — XSUAA Simulation
 */
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../config/database';
import { AUTH_CONFIG } from '../config/auth';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', (req: AuthRequest, res: Response) => {
  try {
    const { username, password, role, fullName } = req.body;
    if (!username || !password || !role || !fullName) {
      res.status(400).json({ error: 'All fields required: username, password, role, fullName' });
      return;
    }
    const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) { res.status(409).json({ error: 'Username already exists' }); return; }
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, AUTH_CONFIG.saltRounds);
    execute('INSERT INTO users (id, username, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)', [id, username, passwordHash, role, fullName]);
    res.status(201).json({ id, username, role, fullName });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post('/login', (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return; }
    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
      AUTH_CONFIG.jwtSecret, { expiresIn: AUTH_CONFIG.jwtExpiresIn }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.full_name } });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

router.get('/users', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const users = queryAll('SELECT id, username, role, full_name, created_at FROM users');
    res.json(users);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default router;
