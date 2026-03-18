import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
let JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';

// 如果没有设置JWT_SECRET，自动生成一个随机密钥
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.log('⚠️  JWT_SECRET not set in environment, auto-generated a random secret');
  console.log('🔑 Generated JWT_SECRET:', JWT_SECRET);
}

const JWT_SECRET_USED = JWT_SECRET;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// SQLite database setup
const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS saves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          save_data TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);
    });
  }
});

// Middleware to verify access JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET_USED, (err: any, payload: any) => {
    if (err) return res.sendStatus(403);
    if (payload.type !== 'access') return res.sendStatus(403);
    req.user = { id: payload.id, username: payload.username };
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req: any, res: any) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req: any, res: any) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    try {
      if (await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign(
          { id: user.id, username: user.username, type: 'access' },
          JWT_SECRET_USED,
          { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        const refreshToken = jwt.sign(
          { id: user.id, username: user.username, type: 'refresh' },
          JWT_SECRET_USED,
          { expiresIn: REFRESH_TOKEN_EXPIRY }
        );
        res.json({
          token,
          refreshToken,
          user: { id: user.id, username: user.username },
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Refresh token: exchange refreshToken for new access token (and new refresh token)
app.post('/api/auth/refresh', (req: any, res: any) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  jwt.verify(refreshToken, JWT_SECRET_USED, (err: any, payload: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired refresh token' });
    if (payload.type !== 'refresh') return res.status(403).json({ error: 'Invalid token type' });

    const newToken = jwt.sign(
      { id: payload.id, username: payload.username, type: 'access' },
      JWT_SECRET_USED,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    const newRefreshToken = jwt.sign(
      { id: payload.id, username: payload.username, type: 'refresh' },
      JWT_SECRET_USED,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: { id: payload.id, username: payload.username },
    });
  });
});

// Save Routes
app.get('/api/save', authenticateToken, (req: any, res: any) => {
  db.get('SELECT save_data FROM saves WHERE user_id = ?', [req.user.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'No save found' });
    
    try {
      const saveData = JSON.parse(row.save_data);
      res.json(saveData);
    } catch (e) {
      res.status(500).json({ error: 'Error parsing save data' });
    }
  });
});

app.post('/api/save', authenticateToken, (req: any, res: any) => {
  const saveData = req.body;
  
  if (!saveData) {
    return res.status(400).json({ error: 'Save data is required' });
  }

  const saveDataString = JSON.stringify(saveData);

  db.get('SELECT id FROM saves WHERE user_id = ?', [req.user.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (row) {
      // Update existing save
      db.run(
        'UPDATE saves SET save_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [saveDataString, req.user.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: 'Error updating save' });
          res.json({ message: 'Save updated successfully' });
        }
      );
    } else {
      // Create new save
      db.run(
        'INSERT INTO saves (user_id, save_data) VALUES (?, ?)',
        [req.user.id, saveDataString],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ error: 'Error creating save' });
          res.json({ message: 'Save created successfully' });
        }
      );
    }
  });
});

// 健康检查端点（用于Docker健康检查）
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
