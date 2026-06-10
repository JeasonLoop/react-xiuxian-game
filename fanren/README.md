# 凡人 · 編年史模式（Fanren Canon System）

在既有「修仙文字放置遊戲」之上新增的**正史驅動文字冒險主流程**，以《凡人修仙傳》正史（`game_db/`）為世界骨架，實現 11 項系統需求。新模式與既有放置玩法並存（開局以 `ModeChooser` 選擇），複用既有 `gameStore` 玩家數值、境界、突破、背包等機制。

## 進入方式
開始遊戲 → 模式選擇 → 「凡人 · 編年史模式」→ 深度創角 → 文字冒險主迴圈。
（既有放置玩法仍可由「經典 · 放置歷練模式」進入，未受影響。）

## 架構
```
fanren/
├─ types.ts              所有系統的共用型別契約（含章號錨點來源型別）
├─ worldStore.ts         世界層 Zustand store（時間/NPC/金手指/記憶/分歧），與 gameStore 協作
├─ data/                 由 game_db 經 agent 叢集生成的正史資料（型別安全）
│  ├─ regions.ts            45 地點（人界→靈界→魔界→仙界，含解鎖章號）
│  ├─ canonNpcs.ts          42 NPC × 編年史時間窗（彈性窗：玩家在某章段於某地可遇）
│  ├─ canonTimeline.ts      35 正史事件（章錨點/地點/涉及NPC/介入點/劇透層級）
│  ├─ creationOptions.ts    出身/靈根/道心
│  ├─ goldenFingerArchetypes.ts  金手指範本與平衡基準
│  └─ factions.ts           25 勢力初始狀態
├─ engine/              純邏輯引擎（可單元測試、離線可跑）
│  ├─ clock.ts             自適應時間：天↔年月日、章↔天插值、行動耗時尺度
│  ├─ keywordRouter.ts     關鍵字捕獲＋意圖解析（含中文數字/時長解析）
│  ├─ governor.ts          輸入治理：反機械降神（拒絕/重構＋天道感應升級）
│  ├─ goldenFinger.ts      自定義金手指：文本→平衡結構，能量/業力執行期
│  ├─ canonLoader.ts       正史資料存取：NPC 在任一天的狀態、視窗內到期事件
│  ├─ worldEvolution.ts    世界自然演化：到期正史照常發生、NPC 依編年史推進、分歧標記
│  ├─ reminderRecall.ts    提醒（天機）＋回憶（識海回溯）
│  ├─ worldExpansion.ts    擴充式世界：未知目的地→確定性生成新地域
│  ├─ gmService.ts         GM-AI 敘事（複用 aiConfig/proxy）＋確定性後備敘事
│  ├─ turnEngine.ts        動態回合總成：解析→治理→結算→推時→演化→敘事→提醒/記憶
│  └─ charBuild.ts         由創建結果建構初始 PlayerStats（複用 createInitialPlayer）
└─ ui/                  React 介面
   ├─ ModeChooser.tsx      雙模式入口
   ├─ CanonCreation.tsx    深度創角（含金手指即時平衡預覽）
   └─ CanonView.tsx        主迴圈：狀態列/敘事/快捷/輸入/金手指/天機提醒
```
接入點：`App.tsx` 在 render 分支以 `worldStore.world.enabled` 切換到 `CanonView`，創角走 `CanonCreation`。

## 11 項需求 → 實作對照
| # | 需求 | 實作 |
|---|------|------|
| 1 | 自定義金手指（依文本形成） | `goldenFinger.parseGoldenFinger` 將自由文本→受平衡結構（強度階/能量/業力/限制/盲區）；`CanonCreation` 即時預覽；越誇大者反受削弱、限制增多 |
| 2 | 動態回合制（NPC 相對行動/反應） | `turnEngine.runTurn` 每回合：玩家行動→世界演化→`worldEvolution` 產生在地 NPC 反應 |
| 3 | 世界隨時間自然演化（除非介入） | `worldEvolution.evolveWorld`：時間推進時，未分歧的正史事件照常觸發、NPC 依編年史推進；`markDivergence` 供玩家介入後凍結對應正史 |
| 4 | 數值化＋關鍵字捕獲 | `keywordRouter.parseIntent`（意圖＋目標＋時長）；數值 deltas 經 `worldStore` 套到 `gameStore`（修為觸發既有突破系統） |
| 5 | 每角色獨立編年史＋可改命＋彈性窗 | `canonNpcs.ts` 各 NPC 的 `chronicle[fromChapter,toChapter]` 彈性時間窗；`canonLoader.resolveNpcAtDay` 解析；分歧後保留玩家造成狀態 |
| 6 | 自適應時間流逝 | `clock.TIME_SCALE_DAYS`＋`keywordRouter.extractDuration`（「閉關十年」「三個月」）；瞬間/短/中/長/紀元尺度 |
| 7 | 深度角色創建 | `CanonCreation`：道號/外貌/出身×8/靈根×8/道心×6/起始功法法寶/金手指/難度 |
| 8 | 自行試玩並完善 | 本回合於 localhost 實機試玩，並據此修了 4 處（主角不入雜訊、敘事換行、親歷框定、回憶/未知目的地解析） |
| 9 | 擴充式世界 | `worldExpansion.generateRegion`：未知目的地依界層確定性生成（已驗證「幽嶺坊市」） |
| 10 | 限制輸入、反機械降神 | `governor.govern`：飛升/無敵/憑空資源/操控他人/元指令→拒絕或重構，並以「天道感應」隨累犯升級懲戒 |
| 11 | 提醒＋回憶金手指 | `reminderRecall.buildReminders`（天機：即將/已發生正史、附近NPC，依進度章號防劇透）＋`recall`（識海回溯） |

## 設計要點
- **正史 vs 分歧**：所有正史事件/NPC 預排於世界紀元；玩家不介入則照常推進，介入則以 `Divergence` 凍結對應正史並保留玩家造成的新狀態。
- **防劇透**：`progressChapter` 隨遊玩推進；提醒/事件依 `spoilerLevel` 與進度過濾。
- **數值權威**：引擎決定數值結果，GM-AI 僅負責敘事化（系統提示明令不得推翻/加碼），杜絕 LLM 開掛。
- **離線可玩**：無 `VITE_AI_KEY` 時自動使用確定性後備敘事；設定金鑰（GLM/SiliconFlow，見根目錄 README）後自動改用 LLM 富化敘事。

## 已完成（里程碑）
- ✅ 正史事件在玩家所在地時轉為**互動式介入選項**（旁觀→照常／介入→分歧）。
- ✅ 戰鬥意圖與戰鬥型介入接既有 `TurnBasedBattleModal`。
- ✅ **canon 模式接通全部既有系統**：`App.tsx` canon 分支渲染 `ModalsContainer`＋
  `CanonView` 工具列，背包/角色/功法/煉丹/洞府/宗門/靈寵/境界/成就皆可用；天劫
  經 `useLevelUp`→`TribulationModal` 於 canon 自動觸發。
- ✅ **史冊面板**（`ChroniclePanel`）：我的修仙史／改寫的命運／天下大勢／勢力榜。
- ✅ **金手指覺醒**：依使用次數里程碑提升威能（`goldenFinger.ts` AWAKEN_*）。
- ✅ **探索真實掉落**（`loot.ts`）：探索／催熟靈藥落地真實物品，接通煉丹經濟。

## 後續路線圖（取自 game_db/game/system/research/ROADMAP.md）
**近期高 CP 值**
- 宗門正史連動（七玄門被滅等對玩家產生實際影響）、戰鬥敵人正名為實際 NPC。
- 地圖面板（45 地點文字拓撲，可點選旅行）。
- 探索事件豐富化（接 `adventureTemplateService` 模板庫，多分支奇遇）。
- NPC 關係值 UI＋關係事件（人情/恩怨/道侶/收徒）。
**進階**
- 韓立軌跡干涉（搶先/相遇/撿遺物三模式）、NPC 輓歌日誌、境界面具（隱藏實力）。
- 氣運積分（小綠瓶式複利機緣）、宣告式事件 JSON（資料驅動可擴充）。
**夢幻**
- 道統傳承多周目、歷史漣漪互動地圖、AI GM 跨 session 個人化記憶、「我的修仙史」可分享生命冊。
