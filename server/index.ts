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

// 安全设置
app.disable('x-powered-by');

// 如果没有设置JWT_SECRET，自动生成一个随机密钥
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.log('⚠️  JWT_SECRET not set in environment, auto-generated a random secret');
}

const JWT_SECRET_USED = JWT_SECRET;

app.use(cors({
  // 允许跨域，如果你只有前端在同一个域名可以限制origin
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// 添加安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// SQLite database setup
const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create tables and indexes
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          linuxdo_id TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // migration: 添加 linuxdo_id 字段（如果旧表没有）
      try { db.run('ALTER TABLE users ADD COLUMN linuxdo_id TEXT UNIQUE'); } catch {}

      db.run(`
        CREATE TABLE IF NOT EXISTS saves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          save_data TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // 添加索引加速查询
      db.run(`CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id)`);
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

// 敏感词列表 - 禁止包含这些词的用户名
const BANNED_USERNAME_WORDS = [
  'admin', 'root', 'system', 'moderator', 'mod', 'fuck', 'shit', 'ass', 'porn', 'sex',
  'gay', 'lesbian', 'nigger', 'chink', 'kike', 'spic', 'xi', 'jinping', 'jiang', 'hu',
  'mao', '共产党', '法轮功', '台独', '藏独', '疆独'
];

// 验证用户名格式和敏感词
const validateUsername = (username: string): { valid: boolean; error?: string } => {
  const trimmed = username.trim();

  if (trimmed.length < 2 || trimmed.length > 32) {
    return { valid: false, error: 'Username must be between 2 and 32 characters' };
  }

  // 只允许字母、数字、下划线、中文
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and Chinese characters' };
  }

  // 检查敏感词
  const lowerUsername = trimmed.toLowerCase();
  for (const word of BANNED_USERNAME_WORDS) {
    if (lowerUsername.includes(word.toLowerCase())) {
      return { valid: false, error: 'Username contains forbidden words' };
    }
  }

  return { valid: true };
};

// 验证密码强度
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password cannot exceed 128 characters' };
  }

  // 要求至少包含字母和数字（可以放松要求，但至少增加一点强度）
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { valid: true };
};

// Auth Routes
app.post('/api/auth/register', async (req: any, res: any) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // 验证用户名
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) {
    return res.status(400).json({ error: usernameCheck.error });
  }

  // 验证密码强度
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  const trimmedUsername = username.trim();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [trimmedUsername, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          console.error('Database insert error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req: any, res: any) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const trimmedUsername = username.trim();

  db.get('SELECT * FROM users WHERE username = ?', [trimmedUsername], async (err, user: any) => {
    if (err) {
      console.error('Login database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

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
        res.status(401).json({ error: 'Incorrect password', code: 'INVALID_PASSWORD' });
      }
    } catch (error) {
      console.error('Login error:', error);
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

// ── LinuxDo OAuth ──
const LINUXDO_AUTH_URL = 'https://connect.linux.do/oauth2/authorize';
const LINUXDO_TOKEN_URL = 'https://connect.linux.do/oauth2/token';
const LINUXDO_USER_URL = 'https://connect.linux.do/api/user';
const LINUXDO_CLIENT_ID = process.env.LINUXDO_CLIENT_ID || 'YOUR_LINUXDO_CLIENT_ID';
const LINUXDO_CLIENT_SECRET = process.env.LINUXDO_CLIENT_SECRET || 'YOUR_LINUXDO_CLIENT_SECRET';

// GET /api/auth/linuxdo → 跳转授权
app.get('/api/auth/linuxdo', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] as string || req.protocol;
  const redirectUri = `${protocol}://${req.get('host')}/api/auth/linuxdo/callback`;
  res.redirect(`${LINUXDO_AUTH_URL}?client_id=${LINUXDO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read`);
});

// GET /api/auth/linuxdo/callback?code=xxx
app.get('/api/auth/linuxdo/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).json({ error: '缺少授权码' });

  try {
    const protocol = req.headers['x-forwarded-proto'] as string || req.protocol;
    const redirectUri = `${protocol}://${req.get('host')}/api/auth/linuxdo/callback`;

    // 1. 换 token
    const tokenRes = await fetch(LINUXDO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: LINUXDO_CLIENT_ID, client_secret: LINUXDO_CLIENT_SECRET, redirect_uri: redirectUri }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok || !tokenData.access_token) return res.status(401).json({ error: 'OAuth 授权失败' });

    // 2. 获取用户信息
    const userRes = await fetch(LINUXDO_USER_URL, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
    const ldUser = await userRes.json() as any;
    if (!ldUser.username) return res.status(500).json({ error: '获取用户信息失败' });

    // 3. 查找或创建用户
    const linuxdoId = String(ldUser.id);
    const existing = db.prepare('SELECT * FROM users WHERE linuxdo_id = ?').get(linuxdoId) as any;

    let userId: number;
    let username: string;
    if (existing) {
      userId = existing.id;
      username = existing.username;
    } else {
      username = ldUser.username;
      if (db.prepare('SELECT id FROM users WHERE username = ? AND linuxdo_id IS NULL').get(username)) {
        username = `${ldUser.username}_ld`;
      }
      const result = db.prepare('INSERT INTO users (username, password_hash, linuxdo_id) VALUES (?, ?, ?)').run(username, '', linuxdoId);
      userId = (result as any).lastInsertRowid as number;
    }

    // 4. JWT
    const token = jwt.sign({ id: String(userId), username, type: 'access' }, JWT_SECRET_USED, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.send(`<!DOCTYPE html><html><head><script>window.opener?(window.opener.postMessage({type:'linuxdo-auth',token:'${token}',username:'${username}'},'*'),window.close()):window.location.replace('${frontendUrl}?token=${token}&username=${encodeURIComponent(username)}')</script></head><body>登录成功，正在跳转...</body></html>`);
  } catch (e: any) {
    res.status(500).json({ error: `OAuth 错误: ${e.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
