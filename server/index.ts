import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
const defaultDbDir = path.basename(__dirname) === 'server'
  ? __dirname
  : path.resolve(process.cwd(), 'server');
const defaultDbPath = path.join(defaultDbDir, 'database.sqlite');
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultDbPath;
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

      // migration: 添加 linuxdo_id 字段（已有则跳过）
      db.all("PRAGMA table_info(users)", (err, rows: any[]) => {
        if (!err && rows && !rows.some((r) => r.name === 'linuxdo_id')) {
          db.exec('ALTER TABLE users ADD COLUMN linuxdo_id TEXT');
        }
      });

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

      // 排行榜表：存储从存档中提取的可排序字段
      db.run(`
        CREATE TABLE IF NOT EXISTS rankings (
          user_id INTEGER PRIMARY KEY,
          username TEXT NOT NULL,
          realm_index INTEGER NOT NULL DEFAULT 0,
          realm_level INTEGER NOT NULL DEFAULT 1,
          exp INTEGER NOT NULL DEFAULT 0,
          combat_power INTEGER NOT NULL DEFAULT 0,
          spirit_stones INTEGER NOT NULL DEFAULT 0,
          reputation INTEGER NOT NULL DEFAULT 0,
          achievement_count INTEGER NOT NULL DEFAULT 0,
          kill_count INTEGER NOT NULL DEFAULT 0,
          play_time INTEGER NOT NULL DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rankings_realm ON rankings(realm_index DESC, realm_level DESC, exp DESC)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rankings_combat ON rankings(combat_power DESC)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rankings_stones ON rankings(spirit_stones DESC)`);

      // 交易行表：玩家上架物品
      db.run(`
        CREATE TABLE IF NOT EXISTS market_listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller_id INTEGER NOT NULL,
          seller_name TEXT NOT NULL,
          item_name TEXT NOT NULL,
          item_type TEXT NOT NULL,
          item_description TEXT DEFAULT '',
          item_rarity TEXT NOT NULL DEFAULT '普通',
          price INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          is_equippable INTEGER DEFAULT 0,
          equipment_slot TEXT,
          effect_json TEXT,
          item_source_json TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sold_at DATETIME,
          buyer_id INTEGER,
          FOREIGN KEY (seller_id) REFERENCES users (id)
        )
      `);
      db.run(`CREATE INDEX IF NOT EXISTS idx_market_status ON market_listings(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_market_seller ON market_listings(seller_id)`);
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

// ── 排行榜辅助函数：从存档JSON中提取排名字段 ──
const REALM_ORDER_FOR_RANKING = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '合道期', '长生境'];

function extractRankingData(saveData: any): {
  realm_index: number;
  realm_level: number;
  exp: number;
  combat_power: number;
  spirit_stones: number;
  reputation: number;
  achievement_count: number;
  kill_count: number;
  play_time: number;
} | null {
  try {
    const player = saveData?.player;
    if (!player) return null;

    const realmIndex = REALM_ORDER_FOR_RANKING.indexOf(player.realm);
    const attack = Number(player.attack) || 0;
    const defense = Number(player.defense) || 0;
    const maxHp = Number(player.maxHp) || 0;
    const spirit = Number(player.spirit) || 0;
    const speed = Number(player.speed) || 0;
    const combatPower = Math.floor(attack + defense + maxHp / 10 + spirit + speed);

    return {
      realm_index: realmIndex >= 0 ? realmIndex : 0,
      realm_level: Number(player.realmLevel) || 1,
      exp: Number(player.exp) || 0,
      combat_power: combatPower,
      spirit_stones: Number(player.spiritStones) || 0,
      reputation: Number(player.reputation) || 0,
      achievement_count: Array.isArray(player.achievements) ? player.achievements.length : 0,
      kill_count: Number(player.statistics?.killCount) || 0,
      play_time: Number(player.playTime) || 0,
    };
  } catch {
    return null;
  }
}

function upsertRanking(userId: number, username: string, saveData: any): void {
  const data = extractRankingData(saveData);
  if (!data) return;

  db.run(
    `INSERT INTO rankings (user_id, username, realm_index, realm_level, exp, combat_power, spirit_stones, reputation, achievement_count, kill_count, play_time, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       realm_index = excluded.realm_index,
       realm_level = excluded.realm_level,
       exp = excluded.exp,
       combat_power = excluded.combat_power,
       spirit_stones = excluded.spirit_stones,
       reputation = excluded.reputation,
       achievement_count = excluded.achievement_count,
       kill_count = excluded.kill_count,
       play_time = excluded.play_time,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, username, data.realm_index, data.realm_level, data.exp, data.combat_power, data.spirit_stones, data.reputation, data.achievement_count, data.kill_count, data.play_time],
    (err) => {
      if (err) console.error('排行榜同步失败:', err.message);
    }
  );
}

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
      db.run(
        'UPDATE saves SET save_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [saveDataString, req.user.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: 'Error updating save' });
          res.json({ message: 'Save updated successfully' });
          // 响应已发送，异步同步排行榜
          setImmediate(() => {
            try { upsertRanking(req.user.id, req.user.username, saveData); } catch {}
          });
        }
      );
    } else {
      db.run(
        'INSERT INTO saves (user_id, save_data) VALUES (?, ?)',
        [req.user.id, saveDataString],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ error: 'Error creating save' });
          res.json({ message: 'Save created successfully' });
          // 响应已发送，异步同步排行榜
          setImmediate(() => {
            try { upsertRanking(req.user.id, req.user.username, saveData); } catch {}
          });
        }
      );
    }
  });
});

// 健康检查端点（用于Docker健康检查）
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// ── 排行榜 API ──
const REALM_NAMES = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '合道期', '长生境'];

const LEADERBOARD_SORTS: Record<string, { orderBy: string; aheadCondition: string; getParams: (row: any) => any[] }> = {
  realm: {
    orderBy: 'realm_index DESC, realm_level DESC, exp DESC, updated_at DESC, user_id ASC',
    aheadCondition: `
      (realm_index > ?)
      OR (realm_index = ? AND realm_level > ?)
      OR (realm_index = ? AND realm_level = ? AND exp > ?)
      OR (realm_index = ? AND realm_level = ? AND exp = ? AND updated_at > ?)
      OR (realm_index = ? AND realm_level = ? AND exp = ? AND updated_at = ? AND user_id < ?)
    `,
    getParams: (row) => [
      row.realm_index,
      row.realm_index, row.realm_level,
      row.realm_index, row.realm_level, row.exp,
      row.realm_index, row.realm_level, row.exp, row.updated_at,
      row.realm_index, row.realm_level, row.exp, row.updated_at, row.user_id,
    ],
  },
  combat: {
    orderBy: 'combat_power DESC, realm_index DESC, realm_level DESC, updated_at DESC, user_id ASC',
    aheadCondition: `
      (combat_power > ?)
      OR (combat_power = ? AND realm_index > ?)
      OR (combat_power = ? AND realm_index = ? AND realm_level > ?)
      OR (combat_power = ? AND realm_index = ? AND realm_level = ? AND updated_at > ?)
      OR (combat_power = ? AND realm_index = ? AND realm_level = ? AND updated_at = ? AND user_id < ?)
    `,
    getParams: (row) => [
      row.combat_power,
      row.combat_power, row.realm_index,
      row.combat_power, row.realm_index, row.realm_level,
      row.combat_power, row.realm_index, row.realm_level, row.updated_at,
      row.combat_power, row.realm_index, row.realm_level, row.updated_at, row.user_id,
    ],
  },
  stones: {
    orderBy: 'spirit_stones DESC, realm_index DESC, realm_level DESC, updated_at DESC, user_id ASC',
    aheadCondition: `
      (spirit_stones > ?)
      OR (spirit_stones = ? AND realm_index > ?)
      OR (spirit_stones = ? AND realm_index = ? AND realm_level > ?)
      OR (spirit_stones = ? AND realm_index = ? AND realm_level = ? AND updated_at > ?)
      OR (spirit_stones = ? AND realm_index = ? AND realm_level = ? AND updated_at = ? AND user_id < ?)
    `,
    getParams: (row) => [
      row.spirit_stones,
      row.spirit_stones, row.realm_index,
      row.spirit_stones, row.realm_index, row.realm_level,
      row.spirit_stones, row.realm_index, row.realm_level, row.updated_at,
      row.spirit_stones, row.realm_index, row.realm_level, row.updated_at, row.user_id,
    ],
  },
};

// GET /api/leaderboard?sort=realm|combat|stones&limit=50&offset=0
app.get('/api/leaderboard', (req: any, res: any) => {
  const sort = (req.query.sort as string) || 'realm';
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
  const sortConfig = LEADERBOARD_SORTS[sort] || LEADERBOARD_SORTS.realm;

  try {
    db.all(
      `SELECT user_id, username, realm_index, realm_level, exp, combat_power, spirit_stones, reputation, achievement_count, kill_count, play_time, updated_at
       FROM rankings
       ORDER BY ${sortConfig.orderBy}
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows: any[]) => {
        // 查询失败或表不存在时，返回空数组而非报错
        if (err) {
          console.error('Leaderboard query error:', err.message);
          return res.json({
            sort,
            limit,
            offset,
            total: 0,
            rankings: [],
          });
        }

        const result = (rows || []).map((row, index) => ({
          rank: offset + index + 1,
          user_id: row.user_id,
          username: row.username,
          realm: REALM_NAMES[row.realm_index] || '未知',
          realm_index: row.realm_index,
          realm_level: row.realm_level,
          exp: row.exp,
          combat_power: row.combat_power,
          spirit_stones: row.spirit_stones,
          reputation: row.reputation,
          achievement_count: row.achievement_count,
          kill_count: row.kill_count,
          play_time: row.play_time,
          updated_at: row.updated_at,
        }));

        res.json({
          sort,
          limit,
          offset,
          total: result.length,
          rankings: result,
        });
      }
    );
  } catch (err: any) {
    // 极端情况（如同步异常），也返回空数组
    console.error('Leaderboard unexpected error:', err.message);
    return res.json({
      sort,
      limit,
      offset,
      total: 0,
      rankings: [],
    });
  }
});

// GET /api/leaderboard/me — 获取当前登录用户的排名
app.get('/api/leaderboard/me', authenticateToken, (req: any, res: any) => {
  // 获取用户自己的排名数据
  db.get(
    'SELECT * FROM rankings WHERE user_id = ?',
    [req.user.id],
    (err, myRow: any) => {
      // 数据库错误或无数据时，返回 found: false，不报错
      if (err) {
        console.error('Leaderboard/me query error:', err.message);
        return res.json({ found: false, message: '暂无排名数据' });
      }
      if (!myRow) return res.json({ found: false, message: '您尚未上传存档，无法查看排名' });

      // 查询三种排序的排名：必须和 /api/leaderboard 的 ORDER BY 完全一致
      const queries = [
        { sort: 'realm', config: LEADERBOARD_SORTS.realm },
        { sort: 'combat', config: LEADERBOARD_SORTS.combat },
        { sort: 'stones', config: LEADERBOARD_SORTS.stones },
      ];

      const results: any = { found: true, username: myRow.username };

      let completed = 0;
      queries.forEach(({ sort, config }) => {
        db.get(
          `SELECT COUNT(*) as cnt FROM rankings WHERE ${config.aheadCondition}`,
          config.getParams(myRow),
          (err2, countRow: any) => {
            completed++;
            if (!err2 && countRow) {
              results[`${sort}_rank`] = (countRow.cnt || 0) + 1;
            }
            if (completed === queries.length) {
              res.json(results);
            }
          }
        );
      });
    }
  );
});

// ── 交易行 API ──

// GET /api/market/items — 获取在售商品列表（分页+分类+搜索）
app.get('/api/market/items', (req: any, res: any) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 10), 100);
  const offset = (page - 1) * limit;
  const category = (req.query.category as string) || 'all';
  const search = (req.query.search as string) || '';

  let where = "WHERE status = 'active'";
  const params: any[] = [];

  if (category && category !== 'all') {
    where += ' AND item_type = ?';
    params.push(category);
  }
  if (search.trim()) {
    where += ' AND item_name LIKE ?';
    params.push(`%${search.trim()}%`);
  }

  // 查总数
  db.get(`SELECT COUNT(*) as total FROM market_listings ${where}`, params, (err, row: any) => {
    if (err) return res.json({ items: [], total: 0, page, limit: 0 });
    const total = row?.total || 0;

    // 查分页
    db.all(
      `SELECT id, seller_id, seller_name, item_name as name, item_type as type, item_description as description,
              item_rarity as rarity, price, quantity, is_equippable, equipment_slot, effect_json, created_at
       FROM market_listings ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
      (err2, rows: any[]) => {
        if (err2) return res.json({ items: [], total: 0, page, limit });
        const items = (rows || []).map((r) => ({
          id: `market-${r.id}`,
          name: r.name,
          type: r.type,
          description: r.description || '',
          rarity: r.rarity,
          price: r.price,
          quantity: r.quantity || 1,
          isEquippable: !!r.is_equippable,
          equipmentSlot: r.equipment_slot || undefined,
          effect: r.effect_json ? JSON.parse(r.effect_json) : undefined,
          sellerName: r.seller_name,
          sellerId: 'system',
          createdAt: r.created_at,
        }));
        res.json({ items, total, page, limit });
      }
    );
  });
});

// POST /api/market/list — 上架物品
app.post('/api/market/list', authenticateToken, (req: any, res: any) => {
  const { itemName, itemType, description, rarity, price, quantity, effect, isEquippable, equipmentSlot, itemSourceJson } = req.body;

  if (!itemName || !price || price <= 0) {
    return res.status(400).json({ error: '物品名称和有效价格是必填项' });
  }
  const listingQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

  db.run(
    `INSERT INTO market_listings (seller_id, seller_name, item_name, item_type, item_description, item_rarity, price, quantity, is_equippable, equipment_slot, effect_json, item_source_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      req.user.username,
      itemName,
      itemType || '材料',
      description || '',
      rarity || '普通',
      price,
      listingQuantity,
      isEquippable ? 1 : 0,
      equipmentSlot || null,
      effect ? JSON.stringify(effect) : null,
      itemSourceJson || '',
    ],
    function (err) {
      if (err) {
        console.error('上架失败:', err.message);
        return res.status(500).json({ error: '上架失败' });
      }
      res.json({ success: true, listingId: this.lastID });
    }
  );
});

// POST /api/market/purchase — 购买物品（先查库存再扣）
app.post('/api/market/purchase', authenticateToken, (req: any, res: any) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: '缺少 listingId' });

  const numericId = parseInt(listingId.toString().replace('market-', ''));

  db.get('SELECT * FROM market_listings WHERE id = ? AND status = ?', [numericId, 'active'], (err, listing: any) => {
    if (err || !listing) {
      return res.status(404).json({ error: '商品不存在或已售出' });
    }
    if (listing.seller_id === req.user.id) {
      return res.status(400).json({ error: '不能购买自己的商品' });
    }

    // 返回商品信息（真实扣款在客户端完成，服务端只做库存检查和锁定）
    // 实际扣款由客户端调用 purchase/confirm 完成
    res.json({
      success: true,
      listing: {
        id: listing.id,
        name: listing.item_name,
        type: listing.item_type,
        description: listing.item_description,
        rarity: listing.item_rarity,
        price: listing.price,
        quantity: listing.quantity || 1,
        isEquippable: !!listing.is_equippable,
        equipmentSlot: listing.equipment_slot,
        effect: listing.effect_json ? JSON.parse(listing.effect_json) : undefined,
        itemSourceJson: listing.item_source_json,
      },
    });
  });
});

// POST /api/market/purchase/confirm — 确认购买（扣库存+记录买家）
app.post('/api/market/purchase/confirm', authenticateToken, (req: any, res: any) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: '缺少 listingId' });

  const numericId = parseInt(listingId.toString().replace('market-', ''));

  db.run(
    `UPDATE market_listings SET status = 'sold', buyer_id = ?, sold_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active' AND seller_id != ?`,
    [req.user.id, numericId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: '购买失败' });
      if (this.changes === 0) return res.status(409).json({ error: '商品已被他人买走' });
      res.json({ success: true });
    }
  );
});

// POST /api/market/cancel — 下架自己的商品
app.post('/api/market/cancel', authenticateToken, (req: any, res: any) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: '缺少 listingId' });

  const numericId = parseInt(listingId.toString().replace('market-', ''));

  db.get('SELECT item_source_json FROM market_listings WHERE id = ? AND seller_id = ? AND status = ?',
    [numericId, req.user.id, 'active'],
    (err, listing: any) => {
      if (err || !listing) return res.status(404).json({ error: '商品不存在或无权操作' });

      db.run('UPDATE market_listings SET status = ? WHERE id = ?', ['cancelled', numericId], (err2) => {
        if (err2) return res.status(500).json({ error: '下架失败' });
        // 返回原始物品数据用于客户端还原
        const sourceItem = listing.item_source_json ? JSON.parse(listing.item_source_json) : null;
        res.json({ success: true, item: sourceItem });
      });
    }
  );
});


// ── LinuxDo OAuth ──
const LINUXDO_AUTH_URL = 'https://connect.linux.do/oauth2/authorize';
const LINUXDO_TOKEN_URL = 'https://connect.linux.do/oauth2/token';
const LINUXDO_USER_URL = 'https://connect.linux.do/api/user';
const LINUXDO_CLIENT_ID = process.env.LINUXDO_CLIENT_ID;
const LINUXDO_CLIENT_SECRET = process.env.LINUXDO_CLIENT_SECRET;

// GET /api/auth/linuxdo → 跳转授权
app.get('/api/auth/linuxdo', (req, res) => {
  if (!LINUXDO_CLIENT_ID) {
    return res.status(500).json({ error: 'LinuxDo OAuth not configured: missing LINUXDO_CLIENT_ID' });
  }
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
