# 💾 存档格式说明（当前实现）

本文档基于当前代码实现：`store/gameStore.ts`、`utils/saveManagerUtils.ts`、`types.ts`。

## 顶层结构

```json
{
  "player": { "...": "PlayerStats" },
  "logs": [{ "...": "LogEntry" }],
  "timestamp": 1710000000000
}
```

## player 核心字段（节选）

- 基础：`name`、`realm`、`realmLevel`、`exp`、`maxExp`
- 属性：`hp`、`maxHp`、`attack`、`defense`、`spirit`、`physique`、`speed`、`luck`
- 资源：`spiritStones`、`lotteryTickets`、`lotteryCount`
- 背包与装备：`inventory`、`equippedItems`
- 功法：`cultivationArts`、`unlockedArts`、`activeArtId`
- 宗门：`sectId`、`sectRank`、`sectContribution` 等
- 灵宠：`pets`、`activePetId`
- 成就与称号：`achievements`、`viewedAchievements`、`titleId`、`unlockedTitles`
- 进阶系统：`lifespan`、`maxLifespan`、`spiritualRoots`、`grotto` 等

完整字段以 `types.ts` 的 `PlayerStats` 为准。

## 日志结构

`logs` 为 `LogEntry[]`，通常包含：

- `id`
- `text`
- `type`
- `timestamp`

## 本地存档机制（关键）

当前运行形态：

- 业务流程按单存档读写（键：`STORAGE_KEYS.SAVE`）
- 存档备份键：`STORAGE_KEYS.SAVE_BACKUP`

## 云存档机制

- 云存档内容与本地顶层结构一致（`player` + `logs` + `timestamp`）
- 通过 `GET/POST /api/save` 同步到后端 SQLite
- 需要登录态（Bearer Token）

## 兼容性处理

加载旧存档时会经过兼容补全：

- 入口：`ensurePlayerStatsCompatibility()`
- 会为缺失字段补默认值（如 `statistics`、`grotto`、`spiritualRoots` 等）

## 导入导出

工具函数位于 `utils/saveManagerUtils.ts`：

- `exportSave(saveData)`：导出（Base64 编码）
- `importSave(encoded)`：导入并校验
- `compareSaves(a, b)`：存档对比

## 注意

- 若文档与代码字段不一致，优先以 `types.ts` 与 `saveManagerUtils.ts` 为准。
