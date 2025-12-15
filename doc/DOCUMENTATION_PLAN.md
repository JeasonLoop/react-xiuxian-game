# 文档整理计划

## 📊 当前文档分析

### 文档列表（12个）
1. **README.md** - 文档索引（保留）
2. **QUICK_START.md** - 快速开始（与DEVELOPMENT重复）
3. **ARCHITECTURE.md** - 架构设计（与MODULES有重复）
4. **MODULES.md** - 模块解析（保留）
5. **DEVELOPMENT.md** - 开发指南（与QUICK_START重复）
6. **GAMEPLAY.md** - 游戏玩法（保留）
7. **API.md** - API文档（与AI_CONFIG重复）
8. **SAVE_FORMAT.md** - 存档格式（保留）
9. **BATTLE_SYSTEM_REDESIGN.md** - 战斗系统重构（改进计划）
10. **PET_SYSTEM_IMPROVEMENTS.md** - 灵宠系统改进（改进计划）
11. **CONTRIBUTING.md** - 贡献指南（保留）
12. **AI_CONFIG.md** - AI配置（与API重复）

## 🎯 整理方案

### 合并策略

#### 1. 合并 QUICK_START.md + DEVELOPMENT.md → `DEVELOPMENT.md`
- **原因**: 两者都包含安装、环境配置、开发流程
- **新结构**:
  - 第一部分：快速开始（安装、配置、运行）
  - 第二部分：开发指南（调试、构建、部署、代码规范）

#### 2. 合并 API.md + AI_CONFIG.md → `API.md`
- **原因**: AI配置是API文档的一部分
- **新结构**:
  - AI服务API（包含配置说明）
  - 战斗系统API
  - 跨域处理
  - 安全考虑

#### 3. 合并 BATTLE_SYSTEM_REDESIGN.md + PET_SYSTEM_IMPROVEMENTS.md → `IMPROVEMENTS.md`
- **原因**: 都是改进计划文档
- **新结构**:
  - 战斗系统改进计划
  - 灵宠系统改进计划
  - 其他系统改进建议

#### 4. 精简 ARCHITECTURE.md
- **原因**: 与MODULES.md有重复的项目结构说明
- **调整**: 保留架构设计、技术栈、设计模式，移除详细目录结构（由MODULES.md负责）

## 📁 最终文档结构（8个文档）

```
doc/
├── README.md              # 文档索引（更新）
├── DEVELOPMENT.md         # 开发指南（合并QUICK_START+DEVELOPMENT）
├── ARCHITECTURE.md        # 架构设计（精简）
├── MODULES.md             # 模块解析（保留）
├── API.md                 # API和配置文档（合并API+AI_CONFIG）
├── GAMEPLAY.md            # 游戏玩法（保留）
├── SAVE_FORMAT.md         # 存档格式（保留）
├── IMPROVEMENTS.md        # 改进计划（合并BATTLE+PET）
└── CONTRIBUTING.md        # 贡献指南（保留）
```

## ✅ 整理步骤

1. ✅ 创建本文档（整理计划）
2. ⏳ 合并 QUICK_START + DEVELOPMENT → DEVELOPMENT.md
3. ⏳ 合并 API + AI_CONFIG → API.md
4. ⏳ 合并 BATTLE + PET → IMPROVEMENTS.md
5. ⏳ 精简 ARCHITECTURE.md
6. ⏳ 更新 README.md
7. ⏳ 删除已合并的旧文档

## 📝 文档分类

### 入门文档
- **README.md** - 文档导航和概览
- **DEVELOPMENT.md** - 快速开始和开发指南

### 技术文档
- **ARCHITECTURE.md** - 架构设计和技术选型
- **MODULES.md** - 模块和目录详解
- **API.md** - API使用和配置

### 游戏文档
- **GAMEPLAY.md** - 游戏玩法说明
- **SAVE_FORMAT.md** - 存档格式说明

### 项目文档
- **IMPROVEMENTS.md** - 改进计划和需求
- **CONTRIBUTING.md** - 贡献指南

