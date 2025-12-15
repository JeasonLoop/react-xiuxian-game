# 🔌 API 文档

本文档详细说明项目中使用的 API 和服务接口。

## 📡 AI 服务 API

### 多提供商支持

项目支持多种 AI 服务提供商来生成游戏事件和剧情，默认使用 GLM（智谱）作为 AI 提供商。

#### 支持的提供商

- **GLM (智谱)** - 默认提供商
- **SiliconFlow** - Qwen2.5-72B-Instruct 模型
- **OpenAI** - GPT 系列模型
- **Custom** - 自定义 API

#### 配置信息

```typescript
// config/aiConfig.ts
// 默认配置
const DEFAULT_PROVIDER = 'glm';
const DEFAULT_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-4.5-air';

// API Key 必须从环境变量获取
const API_KEY = import.meta.env.VITE_AI_KEY;
```

#### 环境变量（必需）

**⚠️ 重要**: API Key 必须通过环境变量配置，不再支持硬编码。

创建 `.env.local` 文件（此文件不会被提交到 Git）：

```bash
# .env.local
# AI 提供商选择: 'glm' | 'siliconflow' | 'openai' | 'custom'
VITE_AI_PROVIDER=glm
VITE_AI_KEY=your-api-key-here
VITE_AI_MODEL=glm-4.5-air
VITE_AI_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
# 是否使用代理（开发环境默认 true，生产环境默认 false）
VITE_AI_USE_PROXY=true
```

**获取 API Key**:

- **GLM (智谱)**: 访问 [智谱AI](https://open.bigmodel.cn) 注册账号并创建 API Key
- **SiliconFlow**: 访问 [SiliconFlow](https://siliconflow.cn) 注册账号并创建 API Key
- **OpenAI**: 访问 [OpenAI](https://platform.openai.com) 注册账号并创建 API Key

### 支持的提供商详细配置

#### GLM (智谱AI) - 默认推荐

**配置**:

```bash
VITE_AI_PROVIDER=glm
VITE_AI_KEY=your-glm-api-key
VITE_AI_MODEL=glm-4.5-air
```

**特点**:

- 国内访问速度快
- 支持 glm-4.5-air 等高质量模型
- API 兼容 OpenAI 格式
- 适合中文场景

#### SiliconFlow

**配置**:

```bash
VITE_AI_PROVIDER=siliconflow
VITE_AI_KEY=your-siliconflow-key
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
```

**特点**:

- 国内访问速度快
- 支持多种开源模型
- 价格相对便宜

#### OpenAI

**配置**:

```bash
VITE_AI_PROVIDER=openai
VITE_AI_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo
```

**特点**:

- 模型质量高
- 需要科学上网（国内）
- 价格相对较高

#### 自定义服务

**配置**:

```bash
VITE_AI_PROVIDER=custom
VITE_AI_KEY=your-custom-key
VITE_AI_API_URL=https://your-api.com/v1/chat/completions
VITE_AI_MODEL=your-model-name
```

**要求**:

- API 必须兼容 OpenAI API 格式
- 支持 POST `/v1/chat/completions` 端点
- 使用 Bearer token 认证

### 切换提供商

只需修改 `.env.local` 文件：

```bash
# 从 GLM 切换到 OpenAI
VITE_AI_PROVIDER=openai
VITE_AI_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo

# 或切换到 SiliconFlow
VITE_AI_PROVIDER=siliconflow
VITE_AI_KEY=your-siliconflow-key
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
```

然后重启开发服务器。

### API 函数

#### 1. generateAdventureEvent

生成历练事件。

**函数签名**:

```typescript
generateAdventureEvent(
  player: PlayerStats,
  adventureType: AdventureType = 'normal'
): Promise<AdventureResult>
```

**参数**:

- `player: PlayerStats` - 玩家当前状态
- `adventureType: AdventureType` - 事件类型
  - `'normal'` - 普通历练
  - `'lucky'` - 大机缘
  - `'secret_realm'` - 秘境探索

**返回**:

```typescript
interface AdventureResult {
  story: string;                    // 事件描述
  hpChange: number;                 // 气血变化
  expChange: number;                 // 修为变化
  spiritStonesChange: number;        // 灵石变化
  lotteryTicketsChange?: number;     // 抽奖券变化
  inheritanceLevelChange?: number;  // 传承等级变化
  attributeReduction?: {            // 属性降低
    attack?: number;
    defense?: number;
    // ...
  };
  triggerSecretRealm?: boolean;     // 是否触发随机秘境
  eventColor: 'normal' | 'gain' | 'danger' | 'special';
  itemObtained?: {                  // 获得的物品
    name: string;
    type: string;
    description: string;
    rarity?: string;
    effect?: {...};
  };
  itemsObtained?: Array<{...}>;     // 多个物品
  petObtained?: string;             // 获得的灵宠模板ID
  petOpportunity?: {                // 灵宠机缘
    type: 'evolution' | 'level' | 'stats' | 'exp';
    // ...
  };
}
```

**使用示例**:

```typescript
const result = await generateAdventureEvent(player, 'normal');
console.log(result.story); // "你在荒野中发现了一株灵草..."
```

**错误处理**:

- API 调用失败时返回默认事件
- JSON 解析失败时抛出错误
- 自动清理 JSON 格式问题
- 支持多提供商自动切换（如果配置了多个）

#### 2. generateBreakthroughFlavorText

生成突破境界的描述文本。

**函数签名**:

```typescript
generateBreakthroughFlavorText(
  realm: string,
  success: boolean
): Promise<string>
```

**参数**:

- `realm: string` - 目标境界名称
- `success: boolean` - 是否突破成功

**返回**: `Promise<string>` - 突破描述文本

**使用示例**:

```typescript
const text = await generateBreakthroughFlavorText('筑基期', true);
// "天地震动，你成功突破瓶颈！"
```

#### 3. generateEnemyName

生成敌人名称和称号。

**函数签名**:

```typescript
generateEnemyName(
  realm: RealmType,
  adventureType: AdventureType
): Promise<{ name: string; title: string }>
```

**参数**:

- `realm: RealmType` - 敌人境界
- `adventureType: AdventureType` - 历练类型

**返回**:

```typescript
{
  name: string; // 敌人名字（2-4个字）
  title: string; // 敌人称号（2-5个字）
}
```

**使用示例**:

```typescript
const enemy = await generateEnemyName(RealmType.QiRefining, 'normal');
// { name: "血牙狼", title: "荒原妖兽" }
```

**降级方案**:

- AI 生成失败时使用预设列表
- 15% 概率使用 AI 生成，85% 使用预设
- 支持多提供商，如果主提供商失败可尝试其他提供商

### API 请求格式

#### 请求结构

```typescript
{
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number; // 0-1，控制随机性
}
```

#### 响应结构

```typescript
{
  choices: Array<{
    message: {
      content: string; // JSON 字符串
    };
  }>;
}
```

### JSON 解析处理

AI 返回的 JSON 可能包含格式问题，代码会自动处理：

1. **移除代码块标记**: ` ```json ... ``` `
2. **移除前置说明文字**: 查找第一个 `{` 或 `[`
3. **移除后置说明文字**: 查找最后一个 `}` 或 `]`
4. **修复数字格式**: `+8` → `8`

## ⚔️ 战斗系统 API

### battleService.ts

#### 1. shouldTriggerBattle

判断是否触发战斗。

**函数签名**:

```typescript
shouldTriggerBattle(
  player: PlayerStats,
  adventureType: AdventureType
): boolean
```

**触发概率**:

- 普通历练: 22% 基础概率
- 机缘历练: 8% 基础概率
- 秘境历练: 45% 基础概率

**影响因素**:

- 境界越高，概率越高
- 速度越高，概率越高
- 幸运越高，概率越低

#### 2. resolveBattleEncounter

解析战斗结果。

**函数签名**:

```typescript
resolveBattleEncounter(
  player: PlayerStats,
  adventureType: AdventureType
): Promise<BattleResolution>
```

**返回**:

```typescript
interface BattleResolution {
  adventureResult: AdventureResult;
  replay: BattleReplay;
}

interface BattleReplay {
  id: string;
  enemy: {
    name: string;
    title: string;
    realm: RealmType;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  rounds: BattleRoundLog[];
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  summary: string;
  expChange: number;
  spiritChange: number;
}
```

**战斗机制**:

- 回合制战斗
- 基于速度的行动顺序
- 伤害计算: `attack * 0.9 - defense * 0.45`
- 暴击概率: 8% 基础 + 速度加成
- 最大回合数: 40 回合

**敌人强度**:

- 弱敌: 60-80% 玩家强度
- 普通: 80-100% 玩家强度
- 强敌: 100-120% 玩家强度

**奖励系统**:

- 胜利: 获得经验和灵石，可能获得搜刮物品
- 失败: 损失经验和灵石，保留 8% 气血

## 🌐 跨域处理

### 开发环境

使用 Vite 代理配置：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: getProxyTarget(), // 根据 VITE_AI_PROVIDER 自动选择目标
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api/, '')
    }
  }
}
```

代理目标会根据 `VITE_AI_PROVIDER` 自动选择：
- `glm`: `https://open.bigmodel.cn`
- `siliconflow`: `https://api.siliconflow.cn`
- `openai`: `https://api.openai.com`

### 生产环境

使用 Vercel Serverless Function：

```javascript
// api/proxy.js
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔐 安全：从服务器端环境变量读取 API Key（不从前端请求获取）
  const apiKey = process.env.VITE_AI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'API Key not configured',
      message: 'VITE_AI_KEY environment variable is not set on the server',
    });
  }

  // 转发请求到目标 API（使用服务器端的 API Key）
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`, // 使用服务器端的 API Key
    },
    body: JSON.stringify(req.body),
  });

  // 返回结果
  const data = await response.json();
  res.status(response.status).json(data);
}
```

**重要说明**：
- ✅ 前端请求**不包含** Authorization 头（API Key 完全隐藏）
- ✅ API Key 从服务器端环境变量 `VITE_AI_KEY` 读取
- ✅ 代理服务器自动添加 Authorization 头，前端无法看到 API Key
- ✅ 支持多提供商，代理会根据 `VITE_AI_PROVIDER` 自动选择目标 API

### Vercel 配置

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/v2/chat/completions",
      "destination": "/api/proxy"
    }
  ]
}
```

## 🔐 安全考虑

### API Key 安全机制

**当前实现**:

- ✅ API Key 必须通过环境变量配置
- ✅ 已移除硬编码的 API Key
- ✅ `.env.local` 文件已加入 `.gitignore`
- ✅ **使用代理模式时，API Key 不会暴露给前端**
- ✅ 支持多提供商切换，通过 `VITE_AI_PROVIDER` 环境变量配置

**安全机制说明**:

#### 使用代理模式（推荐，默认）

当使用代理（`VITE_AI_USE_PROXY=true` 或生产环境）时：

- ✅ **API Key 完全隐藏**：前端请求不包含 Authorization 头
- ✅ **服务器端处理**：代理服务器从环境变量读取 API Key
- ✅ **安全传输**：API Key 只在服务器端使用，不会通过网络传输到客户端
- ✅ **无法查看**：用户无法在浏览器开发者工具中看到 API Key

**工作流程**：
```
前端 → /api/proxy（无 Authorization 头）
     ↓
服务器端代理 → 从环境变量读取 VITE_AI_KEY → 添加 Authorization 头 → AI 服务
```

#### 直连模式（不推荐）

当 `VITE_AI_USE_PROXY=false` 时：

- ⚠️ **API Key 暴露**：前端请求包含 Authorization 头
- ⚠️ **安全风险**：任何人都可以在浏览器开发者工具中查看 API Key
- ⚠️ **仅限开发**：仅建议在本地开发且 API 支持 CORS 时使用

**配置方法**:

1. **本地开发**：创建 `.env.local` 文件（不会被提交到 Git）
   ```bash
   VITE_AI_PROVIDER=glm  # 选择提供商: 'glm' | 'siliconflow' | 'openai' | 'custom'
   VITE_AI_KEY=your-api-key-here
   VITE_AI_MODEL=glm-4.5-air  # 可选，使用默认模型时可省略
   VITE_AI_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions  # 可选，使用默认URL时可省略
   VITE_AI_USE_PROXY=true  # 推荐：使用代理模式
   ```

2. **生产环境**：在部署平台配置环境变量
   - Vercel: 项目设置 → Environment Variables → 添加以下变量：
     - `VITE_AI_PROVIDER` (可选，默认 'glm')
     - `VITE_AI_KEY` (必需)
     - `VITE_AI_MODEL` (可选)
     - `VITE_AI_API_URL` (可选)
     - `VITE_AI_USE_PROXY` (可选，推荐 'true')
   - 其他平台: 根据平台文档配置环境变量

3. **安全提示**:
   - 🚨 不要将 API Key 提交到代码仓库
   - 🚨 如果 API Key 泄露，立即在服务商处重新生成
   - 🚨 生产环境必须使用代理模式

### 请求限制

- 注意 API 的调用频率限制
- 实现请求重试机制（可选）
- 添加错误处理和降级方案

## 🐛 错误处理

### AI 服务错误

```typescript
try {
  const result = await generateAdventureEvent(player);
} catch (error) {
  // 返回默认事件
  return {
    story: '你在荒野中游荡了一番，可惜大道渺茫，此次一无所获。',
    hpChange: 0,
    expChange: 5,
    spiritStonesChange: 0,
    eventColor: 'normal',
  };
}
```

### 网络错误

- 自动重试（可选）
- 降级到预设事件
- 显示错误提示给用户

### JSON 解析错误

- 自动清理 JSON 格式
- 记录原始响应用于调试
- 抛出详细错误信息

## 📊 API 使用统计

### 调用频率

- **历练事件**: 每次点击"历练"按钮调用一次
- **突破描述**: 每次突破境界调用一次
- **敌人名称**: 15% 的战斗会调用（其余使用预设）

### 成本估算

- **GLM (智谱)**: 按 token 计费，价格相对较低
- **SiliconFlow**: 按 token 计费
- **OpenAI**: 按 token 计费，价格相对较高
- 每次历练事件约消耗 500-1000 tokens
- 建议监控 API 使用量，根据预算选择合适的提供商

## 🔧 调试技巧

### 查看 API 请求

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 筛选 XHR/Fetch 请求
4. 查看请求和响应详情

### 查看 API 响应

```typescript
// services/aiService.ts
console.log('API Response:', resultText);
console.log('Parsed JSON:', JSON.parse(cleanedJson));
```

### 测试 API

```typescript
// 测试函数
const testAPI = async () => {
  const player = createInitialPlayer('测试', 'talent-ordinary');
  const result = await generateAdventureEvent(player, 'normal');
  console.log(result);
};
```

### 使用 curl 测试

```bash
# 开发环境（通过代理，不需要 Authorization 头，由服务器端处理）
curl 'http://localhost:5173/api/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen2.5-72B-Instruct","messages":[{"role":"user","content":"Hello"}]}'

# 直接请求（如果 API 支持 CORS，需要 Authorization 头）
curl 'https://api.siliconflow.cn/v1/chat/completions' \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen2.5-72B-Instruct","messages":[{"role":"user","content":"Hello"}]}'
```

**注意**：使用代理时，前端请求不需要（也不应该）包含 Authorization 头，API Key 由服务器端自动添加。

## ⚠️ 故障排查

### 404 错误（或 CORS 错误）

**原因**: API 路径不正确

**解决方法**:

1. 检查 `VITE_AI_API_URL` 是否正确
2. 确保路径包含 `/v1/chat/completions`
3. 开发环境推荐 `VITE_AI_USE_PROXY=true`（默认即为 true，可避免 CORS）
4. 检查浏览器控制台的网络请求，查看实际请求的 URL

### 401 错误

**原因**: API Key 无效或缺失

**解决方法**:

1. 检查 `.env.local` 文件是否存在
2. 检查 `VITE_AI_KEY` 是否正确
3. 重启开发服务器（环境变量更改后需要重启）
4. 验证 API Key 是否有效

### 跨域错误

**原因**: 直接请求 API 时遇到 CORS 限制

**解决方法**:

1. 开发环境：设置 `VITE_AI_USE_PROXY=true`（使用 Vite 代理）
2. 生产环境：使用 Vercel Function 代理（已配置）
3. 如果 API 支持 CORS，可以设置 `VITE_AI_USE_PROXY=false`

### 代理不工作

**原因**: Vite 代理配置问题

**解决方法**:

1. 检查 `vite.config.ts` 中的代理配置
2. 确保代理目标 URL 正确
3. 检查端口是否正确（默认 5173）
4. 查看 Vite 控制台的代理日志

## 📚 相关文档

- [架构设计](./ARCHITECTURE.md) - 整体架构说明
- [开发指南](./DEVELOPMENT.md) - 开发实践
- [模块解析](./MODULES.md) - 模块说明

## 🔗 外部资源

- [GLM (智谱) 文档](https://open.bigmodel.cn)
- [SiliconFlow 文档](https://siliconflow.cn)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [Vercel Functions](https://vercel.com/docs/functions)

---

**注意**: API Key 是敏感信息，请妥善保管，不要泄露。
