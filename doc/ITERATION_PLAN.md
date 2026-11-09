# 迭代计划（v0.3.9 → v0.5.0）

> 依据 2026 年度项目审查结论制定：三路审查（玩法深度 / 数值平衡 / 代码质量）覆盖 226 个文件、约 7 万行代码。
> 原则：先堵漏洞，再还技术债，再做玩法深度，联机最后。不引入非必要第三方依赖，动效全部用 CSS + 现有 Tailwind 体系实现。

---

## 里程碑总览

| 里程碑 | 主题 | 内容 | 规模预估 |
|---|---|---|---|
| **M1 · v0.3.9a** | 数值漏洞修复 | 6 个 P0 经济/数值漏洞 | 小，纯数值与逻辑 |
| **M2 · v0.3.9b** | 交互反馈系统升级 | 全局交互基座 + 动效体系（本次重点） | 中，跨 20+ 弹窗组件 |
| **M3 · v0.3.9c** | 技术债清理 | "现在就该修"清单 + 快速战斗公式统一 | 小 |
| **M4 · v0.4.0** | 玩法深度一期 | 机制型词条池 + 化神以上专属副本与机制型 BOSS | 大 |
| **M5 · v0.4.x** | 玩法深度二期 | 历练事件分支选择 + 灵宠技能/远征扩容 | 中 |
| **M6 · v0.5.0** | 联机玩法 | PVP 切磋（服务端校验先行） | 大 |

依赖关系：M1 与 M2 无依赖可并行；M3 依赖 M2（避免重复改动弹窗代码）；M4 依赖 M1（词条上限先落地）；M6 依赖 M4 的战斗机制改造。

---

## M1 · 数值漏洞修复（P0，先于一切新功能）

### 1.1 传承石跳层漏洞（全游戏最大经济漏洞）
- **问题**：传承石 5 万灵石/枚（`shopService.ts:102`），可在 `useBreakthroughHandlers.ts:325-351` 免检直升一个境界层；长生境单层修为需求 4525 万，投入产出比 1:900。
- **方案**：传承石仅允许用于「小境界层（1-9 层）跳层且不可跨大境界」，售价按目标境界指数放大（如 `50000 × 8^境界序号`）；大境界突破必须正常积累感悟。
- **验收**：金丹期以上使用传承石的成本明显高于正常修炼时间成本；UI 显示明确的限制说明。

### 1.2 inheritanceLevel 一字段两用
- **问题**：同字段既是转世次数（`RebirthModal.tsx:40`）又是传承跳层依据（`useBreakthroughHandlers.ts:319`），转世后可立刻购买传承石回退档位。
- **方案**：拆分为 `rebirthCount`（转世次数）与 `inheritanceUsed`（传承使用状态），存档迁移时保留旧值映射，走 `saveManagerUtils` 迁移函数。
- **验收**：转世 → 购买传承石 → 无法再跳层；旧存档读档不报错。

### 1.3 词条总量无上限
- **问题**：attackPercent 等词条跨 7 装备位直接累加（`statUtils.ts:335-346`），理论 +462% 攻击。
- **方案**：在 `statUtils` 汇总处增加全身百分比词条软上限（攻击/防御/气血各 50%，超出部分收益减半而非截断），并在角色面板展示「词条收益已达上限」提示。
- **验收**：全身仙品洗炼极限下攻击加成 ≤ 约 300%（软上限递减后），数值可配置集中在 `constants/balance.ts`。

### 1.4 转世收益造假
- **问题**：RebirthModal 展示「修炼速度 +10%~70%」但 `statUtils.ts:151-246`（calculateTotalExpRate）无 inheritanceLevel 引用，从未实装。
- **方案**：实装修炼速度加成（接入 `calculateTotalExpRate`，与灵根/洞府加成乘算）；实装后在转世确认弹窗显示当前实际加成。
- **验收**：转世后打坐单位时间修为确实提升；面板显示真实数值。

### 1.5 抽奖重复补偿与境界脱钩
- **问题**：集齐功法/灵宠后固定赔 8000~20000 灵石（`useLotteryHandlers.ts:8-50`），后期成为主要产出渠道；同批多抽误吞刚获得的新宠物。
- **方案**：补偿改为「基础值 × 境界系数」；修复多抽批次内先判重再入包的顺序，使本批新获得宠物不再被当作重复。
- **验收**：后期 10 连抽的灵石期望不超过同期历练小时收入的 30%；10 连不会吞新宠。

### 1.6 离线修为溢出浪费
- **问题**：离线修为截断在 2×maxExp 后直接丢弃（`offlineEarnings.ts:114-117`），修为泵逻辑（`cultivationUtils.ts:281-299`）未复用。
- **方案**：溢出部分注入修为泵/感悟积累，结算弹窗展示「溢出转化为感悟」。
- **验收**：24h 离线后上线无修为凭空丢弃。

---

## M2 · 交互反馈系统升级（本次开发重点）

**目标**：整个系统有统一、强风格的交互反馈——每个可点击元素都有 hover/active/focus 状态，弹窗有出入场动效，Tab 有滑动指示条，反馈动画贴合「水墨修仙」金色主题。
**风格基调（已确认）**：干脆利落（150~250ms）+ 回弹反馈——入场动效带轻微弹性回弹（spring 缓动），按压有 scale 反馈，不做华丽堆砌。

### 2.1 交互设计令牌（基建，先做）
- **文件**：`index.css` + `tailwind.config.js`
- **内容**：
   - 动效时长令牌：`--dur-fast: 150ms`（hover/按压）、`--dur-base: 200ms`（Tab/内容切换）、`--dur-slow: 250ms`（弹窗出入场）；
   - 缓动令牌：`--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`、`--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`（入场回弹，过冲 ≤1.05 倍）；
  - `prefers-reduced-motion: reduce` 时全局动画时长归零。
- **验收**：所有动效引用同一组令牌，改一处全局生效。

### 2.2 全局按钮体系
- **现状**：按钮样式散落在 20+ 组件各自手写；无统一 hover；禁用态光标混乱。
- **方案**（不引入组件库，用 CSS 基座 + 少量工具类）：
  1. `index.css` 基座规则：`button { cursor: pointer; transition: 背景色/边框/阴影/transform var(--dur-fast) }`；`button:disabled { cursor: not-allowed; opacity: 0.5 }`；`:active { transform: scale(0.97) }`；`:focus-visible` 显示金色描边环（键盘可达性）。
  2. 新增少量语义工具类供高频场景替换：`.btn-gold`（金色主按钮：hover 提亮 + 金色光晕阴影 + translateY(-1px)）、`.btn-ghost`（描边幽灵按钮：hover 背景淡金填充）、`.btn-danger`（血红系，hover 加深）。不强制全量替换，先替换主流程按钮（打坐/历练/突破/商店/抽奖/确认弹窗）。
  3. 卡片/列表项 hover 统一：边框金色提亮 + 背景微亮 + 阴影扩散，150ms。
- **验收**：全项目 grep 不存在「可点击但 default 光标」的按钮；主流程按钮三类风格统一；移动端 hover 不粘连（touch 设备降级为 active 态）。

 ### 2.3 弹窗出入场动效
 - **现状**：弹窗用 `{isOpen && <Modal/>}` 条件渲染，打开即出现、关闭即消失，只有入场 fade（无退场）。
 - **方案（最小改动，避免大重构）**：
   1. 新增 `hooks/useDelayedUnmount.ts`：`isOpen=false` 后保持挂载约 260ms 并置 `data-state="closed"`，动画结束真正卸载；提供 `mounted / state` 两个返回值。
   2. 实施调整（比原计划更优）：项目已有共享弹窗组件 `components/common/Modal.tsx`，绝大部分弹窗都在复用。直接在共享 Modal 内接入 useDelayedUnmount + 出入场动效类（`modal-shell-overlay` / `modal-shell-panel`），**一处改动覆盖全部共享 Modal 弹窗**，不再需要逐个迁移 ModalShell。
   3. 在 `views/modals/ModalsContainer.tsx` 为 5 个高频弹窗（Inventory/Character/Cultivation/Shop/TurnBasedBattle）增加延迟卸载门控（父级条件渲染会让退场动画失效），关闭动画期间用 ref 保留 shop/battle 数据防止面板内容清空。
   4. Esc 关闭、遮罩点击关闭沿用现有 `onClose`，关闭动画期间禁止二次交互（`pointer-events: none`）。
 - **验收**：任意弹窗打开/关闭都有可感知的平滑过渡（250ms 入带回弹 / 150ms 出）；快速连续开关不闪烁、不残留遮罩；懒加载弹窗 Suspense 兜底文案与动画不冲突。

### 2.4 Tab 切换动效
- **现状**：各弹窗内 Tab（炼丹·炼器、背包分类、角色页签等）为纯色块切换，无过渡。
- **方案**：
  1. 新增 `components/TabBar.tsx` 通用标签条：金色滑动指示条（transform 过渡，不用 width 动画防抖动）、激活项文字提亮、hover 半透明金背景。
   2. 内容区切换统一 `fade + 8px 上移入场`（200ms），复用现有 `fadeIn` keyframes 微调。
  3. 先替换弹窗内 Tab 数量最多的 4 处：CraftingModal（炼丹/炼器）、InventoryModal（分类）、CharacterModal（多页签）、SectModal。
- **验收**：指示条平滑滑动；键盘左右方向键可切换（复用现有快捷键检测模式）；Tab 项 hover 有反馈。

### 2.5 反馈与动效细节
- **Toast/轻提示**：右上角滑入 + 进度条倒计时，退出右滑淡出（现有 `toastUtils.ts` 样式升级）。
- **数字变化**：灵石/修为/气血变化处复用已有 `float-up` 飘字动效，主界面资源栏增加数值变更闪烁高亮（金色 +100 格式）。
- **危险操作确认**：死亡/销毁/转世类弹窗确认按钮 hover 转血红并轻微抖动一次（复用 `shake` keyframes）。
- **战利品获得**：抽奖已有八卦/粒子特效，背包新增物品首次入包时卡片闪金光一次（新增 `loot-flash` keyframe）。
- **验收**： reduced-motion 用户下所有装饰动画关闭；移动端不因动效产生卡顿（只用 transform/opacity 合成层属性）。

### 2.6 不做的事（避免过度设计）
- 不引入 framer-motion 等动画库（CSS 足够）。
- 不做全局主题切换（CHANGELOG 计划项，延后）。
- 不一次性重写 20+ 弹窗——ModalShell 逐个迁移，弹窗内部布局不动。

---

## M3 · 技术债清理

### 现在就修
| 项 | 位置 | 动作 |
|---|---|---|
| 删除 6 个纯转发分组 hook | `hooks/useHandlerGroups.ts` | 直接 useShallow 合并透传，约 -400 行 |
| 删除死代码 | `hooks/useAppUIState.ts:275-281` | 删 useInitDebugMode |
| 空回调 | `hooks/useHandlerGroups.ts:424-427` | handleTurnBasedBattleClose 删除或接真实实现 |
| setter 映射双份 | `useAppUIState.ts:50-80` vs `useAppHandlers.ts:146-172` | 收敛到一处 |
| 稀有度颜色重复 5 处 | BatchRelease/BatchDismantle/TurnBasedBattle/Crafting/SectTreasureVault | 统一 import `utils/rarityUtils.ts` |
| null 存档空指针 | `saveManagerUtils.ts:18` | 入口兜底返回初始玩家或抛带上下文错误 |
| inventoryKey 降本 | `usePassiveRegeneration.ts:37-40` | 换 length + 装备槽 id 拼接 |
| 暴击公式漂移 | `battleService.ts:1096` vs `:2056` | 抽 `computeCritChance` 单一来源，快速战斗补速度闪避 |

### 下个版本修（不进 v0.3.9）
PlayerStats 按子系统聚合、battleService 拆 4 文件、InventoryModal 虚拟化、App.tsx 订阅收窄、旧存档双写移除、uiStore.closeCurrentModal 数据驱动化。

---

## M4 · 玩法深度一期（v0.4.0 核心）

### 4.1 机制型装备词条池（8 → 30+）
- 新增机制词条：反伤、连击、斩杀（低血增伤）、护盾（受击概率生成）、灼烧 DoT、冰冻（概率减速/停手）、受击回灵、击杀回血等。
- 接入点：`battleService` 已有 buff/debuff 管线（`executeSkill`/`updateBattleStateAfterAction`），词条效果全部实现为战斗内触发器；快速战斗用概率摘要模拟保证两模式结果一致性。
- 数值与概率集中 `constants/reforge.ts`；同步扩展洗炼 UI 词条描述渲染。
- 依赖：M1-1.3 全身上限先落地。

### 4.2 化神/合道/长生专属副本 + 机制型 BOSS
- 三档境界大秘境（复用现有秘境/地宫框架），BOSS 带 2-3 阶段机制：换属性相位、需集火召唤物、限时爆发窗口、机制惩罚（超时全体增伤）。
- 敌人 AI 从固定三段式（`battleService.ts:1958-1974`）升级为按 BOSS 脚本驱动。
- 奖励与转世长线目标挂钩（如「前世镜像 Boss」）。
- 依赖：M4-1 词条池（BOSS 机制与玩家词条共用触发器系统）。

---

## M5 · 玩法深度二期（v0.4.x）

- **历练事件分支选择**：`AdventureEventTemplate` 增加 `choices: [{label, risk, reward}]`（2-3 选项），语料池扩容（地点/敌人/NPC 各 5 → 20+）；UI 复用 ReputationEventModal 的选择交互模式。
- **灵宠技能池 4 → 20+**、远征地点 3 → 12、丹方 20 → 40：集中在 `pets.ts` / `petExpedition.ts` / `items.ts` 常量扩展。

---

## M6 · 联机玩法（v0.5.0）

1. **服务端存档校验先行**（安全前提）：PVP/对战读取服务端存档数据而非信任客户端上报；`server/index.ts` 增加存档关键字段（境界/属性/背包物品校验和）验证。
2. **PVP 切磋**：battleService 已是纯函数式状态机；PartyKit 新增「对战房间」消息类型（邀请 → 双端状态广播 → 回合同步），排行榜页内嵌「挑战」入口。
3. **合作地宫**（PVP 验证后沿同一管线）：双人组队 Roguelike 地宫。
4. 交易行已较完整（两阶段确认托管），本期仅做防刷校验收紧。

---

## 执行顺序建议

```
第 1 周    M1（6 个漏洞修复）+ M2.1/M2.2（令牌与按钮基座）   ← 可并行
第 2 周    M2.3（弹窗动效）+ M2.4（Tab）+ M2.5（反馈细节）
第 3 周    M3（技术债）+ 回归验证 + 发版 v0.3.9
第 4-6 周  M4（词条机制池 → 专属副本/BOSS）→ v0.4.0
之后       M5 → M6
```

## 风险与回滚

- M1 涉及存档字段拆分（1.2）：迁移函数向后兼容，旧档先映射后写入，出问题可回退映射。
- M2 弹窗动效：ModalShell 逐个迁移，单弹窗问题不影响其他弹窗；动画失败降级为直接显示（try 兜底不阻塞功能）。
- M4 词条机制：所有新词条效果加开关常量，出平衡问题可一键关闭池中子集。
- 每个里程碑发版前跑 `npm run lint` + 现有 `tests/gameplayBalance.test.ts`，数值改动补充对应测试用例。

---

## v0.3.9 开发进度记录（2026 实施版）

### 已完成

- **M1 全部 6 项数值修复**：传承石指数定价+小境界限制、inheritanceLevel 拆分迁移、词条软上限、转世修炼速度实装、抽奖补偿境界系数、离线溢出注入修为泵（含 SAVE_FORMAT.md 同步）。
- **M2 交互系统**：设计令牌、全局按钮基座、弹窗出入场动效（共享 Modal 一处覆盖全部）、5 个高频弹窗延迟卸载门控、TabBar（3 处替换）、Toast 滑入+进度条、ActionBar hover。
- **M3 部分**：删死代码 useInitDebugMode、5 处稀有度颜色去重、inventoryKey 降本、暴击/闪避公式统一。
- **追加功能修复**：
  - 手动突破：移除自动突破/自动天劫弹窗，改为属性面板「修为圆满·点击突破」按钮（需渡劫时弹确认），溢出修为自动进泵。
  - 保命装备：耗尽后保留在装备栏显示「已耗尽」（不再自动卸下，属性继续生效），日志移出 setPlayer updater。
  - 自动打坐：每 10 次输出汇总日志（模块级计数器），挂机进度可见。
  - 转世奖励 off-by-one：第 5 次转世正确取五转档。
  - TabBar 指示条 ResizeObserver 重测；Toast 动画 key 重播；Modal 滚动锁引用计数。

### v0.3.9 收尾前待办（小项）

- [ ] toast-anim-out 死样式清理（index.css）
- [ ] 转世后重置自动打坐模块级计数器（仅影响换档后第一条汇总日志）

---

## 重构优化路线（v0.3.9 之后，按性价比排序）

### 第一梯队：删代码、降复杂度（收益立竿见影，约半天）

1. **删除 hooks/useHandlerGroups.ts（480 行纯转发）**：6 个分组 hook 零逻辑，让 useGameViewHandlers/useModalsHandlers 内部直连 store（文件内已有此模式）；顺带合并 setter 映射双份维护（useAppUIState vs useAppHandlers）。
2. **移除旧存档格式双写**（gameStore.ts:184-187）：每次防抖保存写两份 JSON；保留旧格式读取兼容，删双写减一半存档 IO。
3. **统一清理 setPlayer updater 内副作用**：useMeditationHandlers / useBreakthroughHandlers / useDeathDetection 三处，日志与 Math.random 移出 updater（StrictMode 下双触发；保命路径已修，照该模式推广）。

### 第二梯队：结构重构（支撑 v0.4.0，约 2-3 天）

4. **拆分 battleService.ts（3006 行）**：enemyFactory（createEnemy+名字池）/ fastBattle / turnBasedEngine / loot 四个文件；M4 词条池与 BOSS 脚本落地前必须完成。
5. **PlayerStats 按子系统聚合**（types.ts 100+ 平铺字段）：参照 player.sect/player.grotto 先例收拢宗门/洞府/日常任务/通天塔字段 + 存档白名单迁移；M4 词条系统前的最后一块地基。
6. **App.tsx 订阅收窄**：useAppUIState 订阅整个 UI store（含每秒 cooldown），任何变化重跑 App 全体 hooks；改组件级订阅。

### 第三梯队：性能优化（穿插进行）

7. **InventoryModal 虚拟化**：后期背包数百物品全量渲染，引入 react-window 或分页（唯一值得加的依赖）。
8. **GrottoModal 每秒整窗重渲染**：倒计时抽独立小组件只订阅时间。
9. **修为泵满溢出静默丢弃**：storeOverflowExp 泵满（20×maxExp）后修为丢失；溢出转感悟/灵石或一次性警告日志。