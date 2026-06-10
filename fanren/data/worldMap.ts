import type { WorldMapNode } from '../types';
// 由 game_db/game/world_map.json 生成（網路爬取＋本地考據彙整，100 節點）。
export const WORLD_MAP: WorldMapNode[] = [
 {
  "id": "renJie",
  "name": "人界",
  "tier": "human",
  "description": "凡人與煉氣至化神期修士棲居的世界，靈氣稀薄，由天南、亂星海、慕蘭草原、大晉、天沙大陸、五龍海六大修煉區域組成。",
  "factions": [],
  "connections": [
   "lingJie"
  ],
  "firstVolume": 1
 },
 {
  "id": "tianNan",
  "name": "天南大陸",
  "tier": "human",
  "parentId": "renJie",
  "description": "人界中型大陸，四面環海（北接無邊海），面積約大晉十分之一；四大勢力並立——正道盟（西）、魔道六宗（東）、天道盟（北）、九國盟（南）。韓立修仙起點。",
  "factions": [
   "正道七派",
   "魔道六宗",
   "天道盟",
   "九國盟"
  ],
  "connections": [
   "muLanCaoYuan",
   "wuBianHai",
   "jiXiZhiDi",
   "luanXingHai"
  ],
  "firstVolume": 1
 },
 {
  "id": "yueGuo",
  "name": "越國",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南中型國，共十三州，正道七派根據地；魔道入侵後由御靈宗為首重新瓜分。",
  "factions": [
   "七玄門",
   "黃楓谷",
   "掩月宗",
   "靈獸山",
   "清虛門",
   "化刀坞",
   "天闕堡",
   "巨劍門"
  ],
  "connections": [
   "yuanWuGuo",
   "ziJinGuo",
   "tianLuoGuo"
  ],
  "firstVolume": 1
 },
 {
  "id": "jingZhou",
  "name": "鏡州",
  "tier": "human",
  "parentId": "yueGuo",
  "description": "越國西北，較貧困之州；七玄門彩霞山所在，韓立出身地青牛鎮附近。",
  "factions": [
   "七玄門"
  ],
  "connections": [],
  "firstVolume": 1
 },
 {
  "id": "qiXuanMen",
  "name": "七玄門（彩霞山）",
  "tier": "human",
  "parentId": "jingZhou",
  "description": "越國七大正道派之一，位於彩霞山落日峰；附設神手谷（墨大夫居所）。韓立修仙起點，後被野狼幫攻山，韓立由此踏上修仙之路。",
  "factions": [
   "七玄門"
  ],
  "connections": [
   "qingNiuZhen"
  ],
  "firstVolume": 1
 },
 {
  "id": "qingNiuZhen",
  "name": "青牛鎮",
  "tier": "human",
  "parentId": "jingZhou",
  "description": "七玄門彩霞山下集鎮，韓家村所在地附近，韓立幼時故鄉。",
  "factions": [],
  "connections": [
   "qiXuanMen"
  ],
  "firstVolume": 1
 },
 {
  "id": "lanZhou",
  "name": "嵐州",
  "tier": "human",
  "parentId": "yueGuo",
  "description": "越國南部第二富足大州，嘉元城為第一大城；太南谷秘境入口在此。",
  "factions": [],
  "connections": [],
  "firstVolume": 2
 },
 {
  "id": "jiaYuanCheng",
  "name": "嘉元城",
  "tier": "human",
  "parentId": "lanZhou",
  "description": "嵐州第一大城，鄉魯大運河貫穿；三大幫派各據一方；驚蛟會總舵設於此。",
  "factions": [
   "驚蛟會"
  ],
  "connections": [],
  "firstVolume": 2
 },
 {
  "id": "taiNanGu",
  "name": "太南谷",
  "tier": "human",
  "parentId": "lanZhou",
  "description": "隱匿於太南山北面迷霧山坡的秘境，每五年舉辦「太南小會」。",
  "factions": [],
  "connections": [],
  "firstVolume": 2
 },
 {
  "id": "jianZhou",
  "name": "建州",
  "tier": "human",
  "parentId": "yueGuo",
  "description": "越國北部，多山川丘陵，與元武國相鄰；太岳山脈橫貫其中。",
  "factions": [
   "黃楓谷"
  ],
  "connections": [
   "yuanWuGuo"
  ],
  "firstVolume": 2
 },
 {
  "id": "huangFengGu",
  "name": "黃楓谷",
  "tier": "human",
  "parentId": "jianZhou",
  "description": "越國七大正道派之一，位於太岳山脈；以超大型奇門大陣遮掩全境，設岳麓殿、傳功閣、百機堂、玄坤山、百藥園等。韓立正式入門地，後遭鬼靈門奪占。",
  "factions": [
   "黃楓谷"
  ],
  "connections": [
   "yuanWuGuo"
  ],
  "firstVolume": 2
 },
 {
  "id": "linZhou",
  "name": "藺州",
  "tier": "human",
  "parentId": "yueGuo",
  "description": "越國（具體方位待考），燕翎堡越國第一家族燕家古堡所在。",
  "factions": [
   "燕家"
  ],
  "connections": [],
  "firstVolume": 3
 },
 {
  "id": "yanLingBao",
  "name": "燕翎堡",
  "tier": "human",
  "parentId": "linZhou",
  "description": "越國第一家族燕家古堡，位於燕梁山；人口逾十萬，佈設護堡禁制。",
  "factions": [
   "燕家"
  ],
  "connections": [],
  "firstVolume": 3
 },
 {
  "id": "yanYueMen",
  "name": "掩月宗（越國故地→玲瓏山）",
  "tier": "human",
  "parentId": "yueGuo",
  "description": "越國七派之首；魔道入侵後被迫遷至九國盟北涼國玲瓏山（分三層）；原故地被鬼靈門奪為總壇。",
  "factions": [
   "掩月宗"
  ],
  "connections": [
   "lingLongShan"
  ],
  "firstVolume": 2
 },
 {
  "id": "lingLongShan",
  "name": "玲瓏山（掩月宗新址）",
  "tier": "human",
  "parentId": "beiLiangGuo",
  "description": "九國盟北涼國境內，掩月宗被魔道驅逐後的新根據地，分三層（上層為元嬰及結丹修士洞府）。",
  "factions": [
   "掩月宗"
  ],
  "connections": [],
  "firstVolume": 7
 },
 {
  "id": "yueJing",
  "name": "越京（越都）",
  "tier": "human",
  "parentId": "yueGuo",
  "description": "越國首都，分四城區；黑煞教老巢（皇宮）所在，越國皇宮中有黑煞教教主修煉密室。",
  "factions": [
   "黑煞教"
  ],
  "connections": [],
  "firstVolume": 3
 },
 {
  "id": "yuanWuGuo",
  "name": "元武國",
  "tier": "human",
  "parentId": "tianNan",
  "description": "越國北邊鄰國，境內有紫道山（付家主堡）、白池山、金馬城；魔道入侵後由魔焰宗操控。",
  "factions": [
   "天星宗",
   "魔焰門（後期）"
  ],
  "connections": [
   "yueGuo"
  ],
  "firstVolume": 3
 },
 {
  "id": "tianLuoGuo",
  "name": "天羅國",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南東部大國，魔道六宗老巢；奇靈山為御靈宗本宗所在。",
  "factions": [
   "合歡宗",
   "御靈宗",
   "魔焰門",
   "天煞宗",
   "千幻宗",
   "鬼靈門"
  ],
  "connections": [
   "yueGuo"
  ],
  "firstVolume": 3
 },
 {
  "id": "fengDuGuo",
  "name": "風都國",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南西部大國，正道盟大本營，面積遠超越國；太真門、天極門等宗門所在。",
  "factions": [
   "太真門",
   "天極門",
   "浩然閣",
   "嵐海閣",
   "赤蓮宗"
  ],
  "connections": [
   "yueGuo",
   "jiXiZhiDi"
  ],
  "firstVolume": 5
 },
 {
  "id": "xiGuo",
  "name": "溪國",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南最北部，共七州；雲夢山脈靈眼聖地，落雲宗、古劍門、百巧院三宗共管；天道盟核心。",
  "factions": [
   "落雲宗",
   "古劍門",
   "百巧院",
   "天道盟"
  ],
  "connections": [
   "wuBianHai",
   "jiuGuoMeng"
  ],
  "firstVolume": 5
 },
 {
  "id": "yunMengShanMai",
  "name": "雲夢山脈",
  "tier": "human",
  "parentId": "xiGuo",
  "description": "天南著名靈脈，終年雲霧繚繞；深處有靈眼之樹；東脈落雲宗、主脈古劍門、西脈百巧院。",
  "factions": [
   "落雲宗",
   "古劍門",
   "百巧院"
  ],
  "connections": [],
  "firstVolume": 5
 },
 {
  "id": "luoYunZong",
  "name": "落雲宗",
  "tier": "human",
  "parentId": "yunMengShanMai",
  "description": "天道盟核心宗門，六奇峰（天泉、火雲、隱劍、幻石、白鳳、鎖煙）；韓立洞府在子母峰；後晉升溪國第一宗。",
  "factions": [
   "落雲宗"
  ],
  "connections": [
   "guJianMen",
   "baiQiaoYuan"
  ],
  "firstVolume": 5
 },
 {
  "id": "guJianMen",
  "name": "古劍門",
  "tier": "human",
  "parentId": "yunMengShanMai",
  "description": "以劍修聞名，太白劍訣為核心傳承；天道盟三大發起宗門之一，位於雲夢山主脈。",
  "factions": [
   "古劍門"
  ],
  "connections": [
   "luoYunZong",
   "baiQiaoYuan"
  ],
  "firstVolume": 5
 },
 {
  "id": "baiQiaoYuan",
  "name": "百巧院",
  "tier": "human",
  "parentId": "yunMengShanMai",
  "description": "以煉器聞名，境內有地肺火池；試劍大會舉辦地；位於雲夢山西脈。",
  "factions": [
   "百巧院"
  ],
  "connections": [
   "luoYunZong",
   "guJianMen"
  ],
  "firstVolume": 5
 },
 {
  "id": "jiuGuoMeng",
  "name": "九國盟",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南最南端九國聯盟，緊鄰慕蘭草原；以抵禦慕蘭法士入侵為首要使命；闐天城為聯盟總壇。",
  "factions": [
   "化意門",
   "貝葉宗",
   "暗影宗"
  ],
  "connections": [
   "muLanCaoYuan"
  ],
  "firstVolume": 5
 },
 {
  "id": "yuGuo",
  "name": "虞國",
  "tier": "human",
  "parentId": "jiuGuoMeng",
  "description": "九國盟核心國，中立勢力；闐天城（聯盟總壇）及離州黃龍山（主戰場）所在。",
  "factions": [
   "化意門"
  ],
  "connections": [
   "beiLiangGuo"
  ],
  "firstVolume": 5
 },
 {
  "id": "tianTianCheng",
  "name": "闐天城",
  "tier": "human",
  "parentId": "yuGuo",
  "description": "天南唯一修士之城，護城大陣「上元滅光陣」；天南第一交易大會舉辦地；後被慕蘭法士攻陷成為法士據點。",
  "factions": [
   "九國盟"
  ],
  "connections": [
   "tianYiCheng"
  ],
  "firstVolume": 5
 },
 {
  "id": "huangLongShan",
  "name": "黃龍山",
  "tier": "human",
  "parentId": "yuGuo",
  "description": "虞國離州邊境；九國盟布有「千音幻化陣」（綠色霧海大陣）；慕蘭之戰主要戰場。",
  "factions": [
   "九國盟"
  ],
  "connections": [],
  "firstVolume": 5
 },
 {
  "id": "beiLiangGuo",
  "name": "北涼國",
  "tier": "human",
  "parentId": "jiuGuoMeng",
  "description": "九國盟成員，修仙資源匱乏；越國六派敗退後重建宗門之地；天一城（臨時抗敵大本營）及掩月宗新址玲瓏山在此。",
  "factions": [
   "掩月宗（新址）"
  ],
  "connections": [
   "yuGuo"
  ],
  "firstVolume": 5
 },
 {
  "id": "tianYiCheng",
  "name": "天一城",
  "tier": "human",
  "parentId": "beiLiangGuo",
  "description": "四大勢力一夜間修建的臨時石城，對抗慕蘭法士入侵的大本營。",
  "factions": [
   "九國盟四大勢力"
  ],
  "connections": [
   "tianTianCheng"
  ],
  "firstVolume": 5
 },
 {
  "id": "dongYuGuo",
  "name": "東裕國",
  "tier": "human",
  "parentId": "jiuGuoMeng",
  "description": "正魔天道三勢力交界，獨立中立；昌州萬嶺山脈藏有天南第一凶地墜魔谷。",
  "factions": [],
  "connections": [],
  "firstVolume": 5
 },
 {
  "id": "zhuiMoGu",
  "name": "墜魔谷",
  "tier": "human",
  "parentId": "dongYuGuo",
  "description": "天南第一凶地，昌州萬嶺山脈中上古戰場遺址；空間紊亂、古陣禁制密布；分外谷（北極元光通道）與內谷（血光禁制，靈緲園、火蟾巢穴）；每五十年有一年相對穩定期。",
  "factions": [],
  "connections": [],
  "firstVolume": 5
 },
 {
  "id": "jiXiZhiDi",
  "name": "極西之地",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南西側飄風沙漠彼端；大衍神君強迫正魔兩道立萬年之誓不得侵佔；千竹教（傀儡術傳承）聖堂所在。",
  "factions": [
   "千竹教"
  ],
  "connections": [
   "fengDuGuo"
  ],
  "firstVolume": 5
 },
 {
  "id": "wuBianHai",
  "name": "無邊海",
  "tier": "human",
  "parentId": "tianNan",
  "description": "天南極北的神秘大海，渾濁無邊；元嬰期修士沿海飛行逾年無法到達彼端；幾乎無生靈。",
  "factions": [],
  "connections": [
   "xiGuo"
  ],
  "firstVolume": 3
 },
 {
  "id": "muLanCaoYuan",
  "name": "慕蘭（天瀾）草原",
  "tier": "human",
  "parentId": "renJie",
  "description": "天南與大晉之間廣袤走廊；慕蘭族（北半部）與突兀族（南半部）分居；草原第一大河天水河（上游與大晉舜江相連）；最終突兀族勝，占領整片草原。",
  "factions": [
   "慕蘭族四大神師",
   "天瀾聖殿（突兀族）"
  ],
  "connections": [
   "tianNan",
   "daJin"
  ],
  "firstVolume": 5
 },
 {
  "id": "tianLanShengDian",
  "name": "天瀾聖殿",
  "tier": "human",
  "parentId": "muLanCaoYuan",
  "description": "突兀族統一管理機構，有石柱法陣護城；擁有元嬰後期四大仙師（徐大仙師、呼大仙師等）。",
  "factions": [
   "突兀族"
  ],
  "connections": [],
  "firstVolume": 6
 },
 {
  "id": "daJin",
  "name": "大晉",
  "tier": "human",
  "parentId": "renJie",
  "description": "人界修仙聖地，面積約天南十倍；共一百零八州、三十六大郡；正魔十大宗門散布其中；大晉七大絕地（部分確認：陰陽窟、火獄、萬毒谷）。",
  "factions": [
   "太一門",
   "天魔宗",
   "岳陽宮",
   "陰羅宗",
   "魔木宗",
   "北夜小極宮"
  ],
  "connections": [
   "muLanCaoYuan",
   "luanXingHai",
   "wuLongHai"
  ],
  "firstVolume": 6
 },
 {
  "id": "jinJing",
  "name": "晉京（晉西坊市）",
  "tier": "human",
  "parentId": "daJin",
  "description": "大晉凡人皇城，分十三區；晉西坊市以隱匿法陣遮掩，三道四宗聯合管轄；九霄殿（元嬰級）、寶光殿（結丹級）拍賣每十年舉行。",
  "factions": [
   "葉家",
   "三道四宗聯合"
  ],
  "connections": [],
  "firstVolume": 6
 },
 {
  "id": "kunWuShan",
  "name": "昆吾山",
  "tier": "human",
  "parentId": "daJin",
  "description": "人界著名靈山，被昆吾三老以九真伏魔大陣封印地下數千年；含萬修之門、昆吾殿、靈寶閣（藏八靈尺、黑風旗）、鎮魔塔（倒建九層，第九層封印元刹聖祖分身）、鑄靈堂（太陰真火）。",
  "factions": [
   "葉家",
   "化仙宗"
  ],
  "connections": [
   "yinYangKu",
   "wanDuGu"
  ],
  "firstVolume": 6
 },
 {
  "id": "yinYangKu",
  "name": "陰陽窟",
  "tier": "human",
  "parentId": "daJin",
  "description": "大晉七大絕地之一，位於萬毒谷中，地下深達數千丈；終年驚魄陰風肆虐，鬼物遍布；深處廣場以困魔陣封禁銀翅夜叉，廣場設傳送大陣通往昆吾山。",
  "factions": [],
  "connections": [
   "kunWuShan",
   "wanDuGu"
  ],
  "firstVolume": 6
 },
 {
  "id": "wanDuGu",
  "name": "萬毒谷",
  "tier": "human",
  "parentId": "daJin",
  "description": "大晉七大絕地之一，大晉南疆；遍布毒花毒草及細小毒蟲，設有禁空古禁制；陰陽窟入口就在谷中。",
  "factions": [],
  "connections": [
   "yinYangKu"
  ],
  "firstVolume": 6
 },
 {
  "id": "huoYu",
  "name": "火獄",
  "tier": "human",
  "parentId": "daJin",
  "description": "大晉七大絕地之一，位於大晉東南部；半州之地的火焰禁區，中心被紅霧籠罩，遍布活火山；韓立在此捕獲太陽精火。",
  "factions": [],
  "connections": [],
  "firstVolume": 6
 },
 {
  "id": "zhenHuanShan",
  "name": "真桓山",
  "tier": "human",
  "parentId": "daJin",
  "description": "大晉四大靈脈之一；正道第一宗太一門所在，化神修士白老鬼坐鎮。",
  "factions": [
   "太一門"
  ],
  "connections": [],
  "firstVolume": 6
 },
 {
  "id": "tianYueShanMai",
  "name": "天岳山脈",
  "tier": "human",
  "parentId": "daJin",
  "description": "方圓十餘萬里；岳陽宮（正道前五）與魔木宗對峙之地，位於大晉陇州方向（待考）。",
  "factions": [
   "岳陽宮",
   "魔木宗"
  ],
  "connections": [],
  "firstVolume": 6
 },
 {
  "id": "fangMangShanMai",
  "name": "邡莽山脈",
  "tier": "human",
  "parentId": "daJin",
  "description": "陰羅宗總壇所在山脈，韓立曾在附近潛伏監視宗主。",
  "factions": [
   "陰羅宗"
  ],
  "connections": [],
  "firstVolume": 7
 },
 {
  "id": "moTuoShan",
  "name": "魔陀山（魔宮）",
  "tier": "human",
  "parentId": "daJin",
  "description": "數萬丈高峰，霧月山脈西北；天魔宗太上長老呼慶雷（呼老魔）隱居之所，宮殿群四季如春。",
  "factions": [
   "天魔宗（呼老魔）"
  ],
  "connections": [],
  "firstVolume": 7
 },
 {
  "id": "beiMingDao",
  "name": "北冥島",
  "tier": "human",
  "parentId": "daJin",
  "description": "大晉最北部北冥海域三面環冰海半島；全島禁空；核心寒驪秘境（冰壁後封閉山谷）含三座虛靈殿和萬年玄玉礦脈玄玉洞。",
  "factions": [
   "北夜小極宮（寒驪上人）"
  ],
  "connections": [],
  "firstVolume": 6
 },
 {
  "id": "wuLongHai",
  "name": "五龍海",
  "tier": "human",
  "parentId": "renJie",
  "description": "大晉外海罕知海域；空間節點入口所在；韓立最終在此與冰鳳共同飛升靈界（V07A05末）。",
  "factions": [],
  "connections": [
   "daJin",
   "lingJie"
  ],
  "firstVolume": 7
 },
 {
  "id": "tianshanDaLu",
  "name": "天沙大陸",
  "tier": "human",
  "parentId": "renJie",
  "description": "人界孤立大陸，四面環海，與其他修仙界幾乎隔絕；韓立晚期到訪，天瀾幼獸在此感應同類後獨自離去。",
  "factions": [],
  "connections": [],
  "firstVolume": 7
 },
 {
  "id": "luanXingHai",
  "name": "亂星海",
  "tier": "human",
  "parentId": "renJie",
  "description": "天南以外廣大海域（韓立由古傳送陣直達）；分內星海（星宮統轄）與外星海（妖海，妖獸橫行）；三大天災：天罡風、妖獸浪潮、鬼霧。",
  "factions": [
   "天星宮",
   "逆星盟",
   "隱煞門",
   "妙音門"
  ],
  "connections": [
   "tianNan",
   "daJin"
  ],
  "firstVolume": 4
 },
 {
  "id": "tianXingCheng",
  "name": "天星城",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "亂星海核心天星島上，以聖山為中心螺旋修建八十一層超級城市；星空殿為傳送樞紐；元磁山藏元磁山法寶。",
  "factions": [
   "天星宮（天星雙聖）"
  ],
  "connections": [
   "nanMingDao",
   "kuiXingDao"
  ],
  "firstVolume": 4
 },
 {
  "id": "kuiXingDao",
  "name": "魁星島",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "亂星海西南三大主島之一；青雲山三大主峰（天柱、天宵、天門）；魁星城含天都街修士交易區和雲夢閣。",
  "factions": [
   "星宮管轄"
  ],
  "connections": [
   "tianXingCheng",
   "xiaoHuanDao"
  ],
  "firstVolume": 4
 },
 {
  "id": "xiaoHuanDao",
  "name": "小寰島",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "魁星島附屬小島，韓立閉關元嬰初期之地。",
  "factions": [],
  "connections": [
   "kuiXingDao"
  ],
  "firstVolume": 4
 },
 {
  "id": "biLingDao",
  "name": "碧靈島",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "外海最北端大型孤島，極品靈石礦脈；逆星盟、天星宮、海族三方瓜分，後由金蛟王率妖修奪取。",
  "factions": [
   "逆星盟",
   "天星宮",
   "海族"
  ],
  "connections": [],
  "firstVolume": 7
 },
 {
  "id": "xuTianDian",
  "name": "虛天殿",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "上古蠻荒古修士遺留密殿，每三百年從天外降落一次懸浮千丈高空；殿內有壽元果、虛天鼎、補天丹；第二層密室設靈眼之泉；第五層設寒驪臺。",
  "factions": [],
  "connections": [],
  "firstVolume": 4
 },
 {
  "id": "nanMingDao",
  "name": "南明島",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "天星城最後外圍中轉島，修士由此進入內星海核心。",
  "factions": [],
  "connections": [
   "tianXingCheng"
  ],
  "firstVolume": 4
 },
 {
  "id": "jiYinDao",
  "name": "極陰島",
  "tier": "human",
  "parentId": "luanXingHai",
  "description": "魔道極陰老祖的勢力根據地；以修煉玄陰魔功為主；掌控隱煞門及多個附屬勢力。",
  "factions": [
   "極陰老祖",
   "隱煞門"
  ],
  "connections": [],
  "firstVolume": 4
 },
 {
  "id": "lingJie",
  "name": "靈界",
  "tier": "spirit",
  "description": "人界之上的中層世界，由風元大陸、雷鳴大陸、血天大陸三塊主大陸組成，多族並存，靈氣遠超人界；修士煉虛至大乘。",
  "factions": [
   "人族三聖皇",
   "七大妖王",
   "飛靈族",
   "天雲十三族",
   "角蚩族",
   "海王族"
  ],
  "connections": [
   "renJie",
   "moJie",
   "xianJie"
  ],
  "firstVolume": 8
 },
 {
  "id": "fengYuanDaLu",
  "name": "風元大陸",
  "tier": "spirit",
  "parentId": "lingJie",
  "description": "靈界三大陸中種族最多元；人族分三境（天元境、玄武境、天妙境）、妖族分七地；地形含青羅沙漠、黑隱山脈、黑葉森林等。",
  "factions": [
   "人族三聖皇",
   "七大妖王",
   "飛靈族",
   "蜉蝣族",
   "木族"
  ],
  "connections": [
   "leiMingDaLu",
   "manHuangShiJie"
  ],
  "firstVolume": 8
 },
 {
  "id": "tianYuanJing",
  "name": "天元境",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "人族三境之一，天元聖皇（儒皇）統治；天元城為百萬修士流動的核心皇城，天元聖山為仙陣陣眼；落日之墓（遠古真靈墜日洼地）在附近。",
  "factions": [
   "天元聖皇府",
   "天元長老會"
  ],
  "connections": [
   "xuanWuJing",
   "tianMiaoJing"
  ],
  "firstVolume": 8
 },
 {
  "id": "tianYuanCheng",
  "name": "天元城",
  "tier": "spirit",
  "parentId": "tianYuanJing",
  "description": "天元聖皇居所，天元聖山為仙陣陣眼，修士流動量達百萬計。",
  "factions": [
   "天元聖皇"
  ],
  "connections": [],
  "firstVolume": 8
 },
 {
  "id": "xuanWuJing",
  "name": "玄武境",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "玄武霸皇統治；玄武城建於古龜「驂靈」背上可移動；進入魔界的節點通道位於此境珊瑚群島（暴魔族駐守）。",
  "factions": [
   "玄武霸皇"
  ],
  "connections": [
   "tianYuanJing",
   "tianMiaoJing"
  ],
  "firstVolume": 8
 },
 {
  "id": "tianMiaoJing",
  "name": "天妙境（天靈境）",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "天妙靈皇（靈皇）統治；天靈城建於擎天靈樹之上，魔劫中被攻陷，擎天巨樹被砍倒。",
  "factions": [
   "天妙靈皇"
  ],
  "connections": [
   "tianYuanJing",
   "xuanWuJing"
  ],
  "firstVolume": 8
 },
 {
  "id": "tianYuanChengSpirit",
  "name": "天淵城",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "風元大陸人妖兩族交界超大型城市，進出蠻荒世界唯一通道；下界飛升修士集中落腳地；含青石巨塔、太玄殿、廣武殿等設施；周邊有浮黎沼澤、翠瀧山；城中修煉速度為他處一倍。",
  "factions": [
   "天淵長老會"
  ],
  "connections": [
   "manHuangShiJie",
   "muZuLingDi"
  ],
  "firstVolume": 8
 },
 {
  "id": "tianPengShengCheng",
  "name": "天鵬聖城",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "飛靈族天鵬族依萬丈巨山群建城，「天鵬之禁」光幕大陣；封靈塔（鯤鵬聖魂封印所）；居民約三四千萬；地淵（飛靈族封魔門以下）入口在此附近。",
  "factions": [
   "天鵬族（飛靈族分支）"
  ],
  "connections": [
   "diYuan"
  ],
  "firstVolume": 9
 },
 {
  "id": "diYuan",
  "name": "地淵",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "風元大陸地下飛靈族封魔門以下的七層地下世界；越深處陰氣越重；含木精洞、冥河神乳神池；每三百年開放供修士試煉；與冥河之地相連。",
  "factions": [
   "飛靈族"
  ],
  "connections": [
   "mingHeZhiDi"
  ],
  "firstVolume": 9
 },
 {
  "id": "mingHeZhiDi",
  "name": "冥河之地",
  "tier": "spirit",
  "parentId": "lingJie",
  "description": "地淵深處/靈界附屬獨立空間，萬丈陰水（冥河）覆蓋；含白骨荒原、血色沼澤、黑幽湖、陰骨山脈；魔墳與神池（冥河神乳）在此；蜉蝣族聖地。",
  "factions": [
   "蜉蝣族"
  ],
  "connections": [
   "diYuan"
  ],
  "firstVolume": 9
 },
 {
  "id": "muZuLingDi",
  "name": "木族領地",
  "tier": "spirit",
  "parentId": "fengYuanDaLu",
  "description": "風元大陸靠近蠻荒世界一帶；萬丈青翠巨樹廣布；以南艮大沙漠（底下為火山口）為前往走廊；木棉城為第二大城（聯軍大本營）；木界三十六天絕陣（自爆後木族疆域盡失）。",
  "factions": [
   "木族"
  ],
  "connections": [
   "tianYuanChengSpirit",
   "manHuangShiJie"
  ],
  "firstVolume": 9
 },
 {
  "id": "manHuangShiJie",
  "name": "蠻荒世界",
  "tier": "spirit",
  "parentId": "lingJie",
  "description": "靈界南部邊境外廣大危險荒野；棲息雷龜、千目巨人、蜃獸等高階古獸；天淵城傳送陣為唯一正式通道；木族與此以「一線天」為界。",
  "factions": [],
  "connections": [
   "tianYuanChengSpirit",
   "muZuLingDi"
  ],
  "firstVolume": 9
 },
 {
  "id": "shengDao",
  "name": "聖島",
  "tier": "spirit",
  "parentId": "lingJie",
  "description": "人妖兩族交界秘地；本身即半個玄天至寶；含天書閣（萬餘種秘術）、混沌萬靈榜；每千年選拔資質過人弟子；合體修士二三十人；莫簡離、敖嘯坐鎮。",
  "factions": [
   "聖島長老會"
  ],
  "connections": [],
  "firstVolume": 10
 },
 {
  "id": "leiMingDaLu",
  "name": "雷鳴大陸",
  "tier": "spirit",
  "parentId": "lingJie",
  "description": "靈界三大陸中整體實力最強；角蚩族與海王族兩大超級族盤踞；廣寒界位於此陸；魔金山脈深處有通往古魔界的空間裂縫。",
  "factions": [
   "角蚩族",
   "海王族",
   "天雲十三族"
  ],
  "connections": [
   "fengYuanDaLu"
  ],
  "firstVolume": 9
 },
 {
  "id": "yunCheng",
  "name": "雲城",
  "tier": "spirit",
  "parentId": "leiMingDaLu",
  "description": "天雲十三族第三大城，懸浮萬丈高空；八雲山（八座極品靈脈）；通靈殿（萬古族議事殿）；四族拍賣大殿（容數十萬人）；後遭角蚩族攻入被迫放棄。",
  "factions": [
   "天雲十三族（晶族、石繭族、萬古族等）"
  ],
  "connections": [
   "lvGuangCheng",
   "fuJiaoCheng"
  ],
  "firstVolume": 9
 },
 {
  "id": "lvGuangCheng",
  "name": "綠光城",
  "tier": "spirit",
  "parentId": "leiMingDaLu",
  "description": "小型交易城市兼傳送陣樞紐，通往天雲大陸各城；角蚩族攻城時被自爆法陣炸毀，後全面落入角蚩族之手。",
  "factions": [
   "角蚩族（佔領後）"
  ],
  "connections": [
   "yunCheng",
   "fuJiaoCheng"
  ],
  "firstVolume": 9
 },
 {
  "id": "fuJiaoCheng",
  "name": "伏蛟城",
  "tier": "spirit",
  "parentId": "leiMingDaLu",
  "description": "距雲城最近的大城，依山脈而建；含超級傳送陣（藏於城中密殿）；雲城失守後人員撤退聚集地。",
  "factions": [
   "天雲十三族"
  ],
  "connections": [
   "yunCheng"
  ],
  "firstVolume": 9
 },
 {
  "id": "guangHanJie",
  "name": "廣寒界",
  "tier": "spirit",
  "parentId": "leiMingDaLu",
  "description": "疑似仙界廢棄附屬空間，每萬年開啟一次；界內靈氣濃度達靈界均值十倍；含暗獸森林、八凶海、萬禽嶺、旭日沙漠及廣寒界遺址（仙人遺留宮殿群）；須持廣寒令進入，合體期以上禁止入內。",
  "factions": [
   "天雲十三族（共管）"
  ],
  "connections": [],
  "firstVolume": 9
 },
 {
  "id": "moJinShanMai",
  "name": "魔金山脈",
  "tier": "spirit",
  "parentId": "leiMingDaLu",
  "description": "雷鳴大陸黑色山脈，約萬年前因空間風暴突現；深處有通古魔界的空間裂縫；含真靈之穴（真麟本源）；每三百年一次魔氣噴發；需辟雷傘穿越青靈雲海入山。",
  "factions": [
   "三名古魔界聖階"
  ],
  "connections": [
   "moJie"
  ],
  "firstVolume": 9
 },
 {
  "id": "xueTianDaLu",
  "name": "血天大陸",
  "tier": "spirit",
  "parentId": "lingJie",
  "description": "靈界三大陸中面積最小；修士多修煉血道功法；以宗門形式劃分領地；血骨門為第一大勢力（5-6名大乘，持玄天之寶黃鳳圖）。",
  "factions": [
   "血骨門"
  ],
  "connections": [],
  "firstVolume": 10
 },
 {
  "id": "moJie",
  "name": "魔界",
  "tier": "demon",
  "description": "與靈界並存的中層界域；靈氣極為稀薄，天空三個血紅太陽，大地魔氣瀰漫；全界聖祖（大乘魔族）不足四十人；魔族三始祖（元魇、涅槃、六極）為最強存在。",
  "factions": [
   "魔族三始祖",
   "青翼族",
   "暴魔族"
  ],
  "connections": [
   "lingJie"
  ],
  "firstVolume": 10
 },
 {
  "id": "xueChaCheng",
  "name": "血鴉城",
  "tier": "demon",
  "parentId": "moJie",
  "description": "建於血光晶礦脈之上的中型城池，常年血光瀰漫；韓立在此拍下通玄藥靈遺骨、奪得泣靈秘藏圖；後遭吸魔蟻海吞沒城破。",
  "factions": [
   "城主炳千刃（合體中期）"
  ],
  "connections": [
   "huanXiaoShaMo"
  ],
  "firstVolume": 10
 },
 {
  "id": "huanXiaoShaMo",
  "name": "幻嘯沙漠",
  "tier": "demon",
  "parentId": "moJie",
  "description": "魔界十大禁地之一；進入後法力被壓制九成，遁術法寶失效；三大魔害：落魂風、地湮沙、幻嘯魔狼；韓立一行以八足魔蜥代步歷時約四十年穿越。",
  "factions": [],
  "connections": [
   "huanYeCheng"
  ],
  "firstVolume": 10
 },
 {
  "id": "huanYeCheng",
  "name": "幻夜城",
  "tier": "demon",
  "parentId": "moJie",
  "description": "幻嘯沙漠出口方向的樞紐城市；白、趙、寧、方四大家族及萬奴塔（奴隸與魔晶傀儡交易）共同把持；十餘名魔尊坐鎮；聖靈院（合體修士居所）在此。",
  "factions": [
   "白家",
   "趙家",
   "寧家",
   "方家",
   "萬奴塔"
  ],
  "connections": [
   "lanPuHu",
   "tieShaLing"
  ],
  "firstVolume": 10
 },
 {
  "id": "lanPuHu",
  "name": "藍瀑湖 / 藍瀑城",
  "tier": "demon",
  "parentId": "moJie",
  "description": "廣大藍色瀑布湖泊；湖中巨型島嶼上的城市；血牙米與異魔金集中產地；廣源齋（跨界情報組織）分支在此；藍瀑聖祖本體坐鎮。",
  "factions": [
   "藍瀑聖祖",
   "廣源齋"
  ],
  "connections": [
   "huanYeCheng"
  ],
  "firstVolume": 10
 },
 {
  "id": "tieShaLing",
  "name": "鐵沙嶺",
  "tier": "demon",
  "parentId": "moJie",
  "description": "通體黑綠山脈，青翼族領地（擁有青鸞真血）；熏香寨等四大駐地；凌源聖祖化身坐鎮。",
  "factions": [
   "青翼族",
   "凌源聖祖（化身）"
  ],
  "connections": [
   "huanYeCheng"
  ],
  "firstVolume": 10
 },
 {
  "id": "moYuanHai",
  "name": "魔源海",
  "tier": "demon",
  "parentId": "moJie",
  "description": "魔界最東端廣大魔海，海面漆黑、雷電密布；魔族起源之地（傳說）；苦靈島坐落其中。",
  "factions": [
   "魔族三始祖（輪守苦靈島）"
  ],
  "connections": [],
  "firstVolume": 10
 },
 {
  "id": "kuLingDao",
  "name": "苦靈島",
  "tier": "demon",
  "parentId": "moYuanHai",
  "description": "魔源海中翠綠巨型島嶼；靈氣精純遠超靈界頂階靈脈；苦靈谷含靈霄天柱；洗靈池（銀色黏稠靈液）與凈靈蓮（可大增慧根）在此；四周為雷海；韓立與黃金巨蟹訂立契約；掌天瓶瓶靈曾封藏於此。",
  "factions": [
   "魔族三始祖",
   "黃金巨蟹"
  ],
  "connections": [
   "moYuanHai"
  ],
  "firstVolume": 10
 },
 {
  "id": "qiLingMiCang",
  "name": "泣靈秘藏",
  "tier": "demon",
  "parentId": "moJie",
  "description": "泣靈聖祖遺留，藏在冰原淡綠小湖湖底；設迷殿、魔晶傀儡大軍和火海三層防護；核心有三件頂階至寶。",
  "factions": [],
  "connections": [],
  "firstVolume": 10
 },
 {
  "id": "shiYinZhiDi",
  "name": "始印之地",
  "tier": "demon",
  "parentId": "moJie",
  "description": "上古封印螟蟲之母之地，周邊被龐大蟲海包圍；地宮含塔林、花園、陣眼殿堂；螟蟲之母藏於地宮最深空間裂縫中；韓立在此習得煉神術第三層。",
  "factions": [],
  "connections": [],
  "firstVolume": 10
 },
 {
  "id": "xianJie",
  "name": "仙界",
  "tier": "immortal",
  "description": "大乘圓滿飛升後的高位界域，靈氣轉化為仙元力；共三十六頂級大域、五百中域及三千小域（概數）；天庭為最高政治機構。",
  "factions": [
   "天庭",
   "九元觀",
   "補天宗"
  ],
  "connections": [
   "lingJie"
  ],
  "firstVolume": 12
 },
 {
  "id": "beiHanXianYu",
  "name": "北寒仙域",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "北方四大仙域之一，常年嚴寒；轄冥寒大陸、上阿大陸、古雲大陸、荒瀾大陸、黑風海域、小天幽境等子區域；飛升台為下界修士接引高台；北寒仙宮為官方管理機構。",
  "factions": [
   "北寒仙宮",
   "石磯殿",
   "蒼流宮",
   "燭龍道",
   "伏凌宗"
  ],
  "connections": [
   "lingHuanJie"
  ],
  "firstVolume": 12
 },
 {
  "id": "feiShengTai",
  "name": "飛升台",
  "tier": "immortal",
  "parentId": "beiHanXianYu",
  "description": "北寒仙域偏遠接引高台；乳白溫泉池，四周覆蔚藍光幕；下界修士飛升抵達仙界的第一落腳點。",
  "factions": [],
  "connections": [],
  "firstVolume": 12
 },
 {
  "id": "mingHanXianFu",
  "name": "冥寒仙府（含月華宮）",
  "tier": "immortal",
  "parentId": "beiHanXianYu",
  "description": "黑風海域神秘洞府，萬年一開；內含幽寒宮（無生劍宗昔日藏寶）；韓立在月華宮大周天星元功修至大成，進階金仙中期；北寒各大宗門金仙強者聚集爭奪。",
  "factions": [
   "北寒各大宗門金仙"
  ],
  "connections": [],
  "firstVolume": 13
 },
 {
  "id": "lingHuanJie",
  "name": "靈寰界",
  "tier": "immortal",
  "parentId": "beiHanXianYu",
  "description": "北寒仙域直屬下位界面；三大宗門並列（冷焰宗、天鬼宗、境元觀）；韓立受重傷失憶後流落此地三百年。",
  "factions": [
   "冷焰宗",
   "天鬼宗",
   "境元觀"
  ],
  "connections": [],
  "firstVolume": 13
 },
 {
  "id": "jinYuanXianYu",
  "name": "大金源仙域",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "三十六頂級大域之一；轄木蘭山脈、金焰山脈；主要城市鎏金城（萬寶節）、九元城（九元觀）；九元觀為霸主宗門，道祖李元究為金之本源法則天道七君之一。",
  "factions": [
   "九元觀",
   "日月盟",
   "百造山",
   "大金源仙宮"
  ],
  "connections": [
   "beiHanXianYu"
  ],
  "firstVolume": 13
 },
 {
  "id": "liuJinCheng",
  "name": "鎏金城",
  "tier": "immortal",
  "parentId": "jinYuanXianYu",
  "description": "大金源仙域重要城市，定期舉辦萬寶節拍賣大會；韓立到達後遭到埋伏。",
  "factions": [],
  "connections": [
   "jiuYuanCheng"
  ],
  "firstVolume": 13
 },
 {
  "id": "jiuYuanCheng",
  "name": "九元城 / 九元觀",
  "tier": "immortal",
  "parentId": "jinYuanXianYu",
  "description": "九元觀為大金源仙域霸主，在真仙界中排名頂尖；九元城為其所在城市；含金翰仙宮（懸浮雲霧海上方數百座山峰之間的附屬仙宮）。",
  "factions": [
   "九元觀（道祖李元究）"
  ],
  "connections": [
   "liuJinCheng"
  ],
  "firstVolume": 13
 },
 {
  "id": "zhongTuXianYu",
  "name": "中土仙域",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "仙界最大仙域，天庭總部所在地；時間道祖在此；補天宗（陳抟，預言法則道祖）修行地。",
  "factions": [
   "天庭",
   "補天宗"
  ],
  "connections": [],
  "firstVolume": 13
 },
 {
  "id": "heiTuXianYu",
  "name": "黑土仙域",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "三十六頂級大域之一；真言門（昔日第一宗派）被天庭滅派後空缺；韓立最終以須彌金山重建真言玄妙界，在此舉行開宗大典，確立仙界第一宗門。",
  "factions": [
   "百造山",
   "真言玄妙界（韓立重建）"
  ],
  "connections": [],
  "firstVolume": 13
 },
 {
  "id": "manHuangJieYu",
  "name": "蠻荒界域",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "仙界邊陲原始界域，靈材豐富；四大王族各自佔領龐大領土；蟲族、獸族為邊緣小族。",
  "factions": [
   "四大王族",
   "蟲族",
   "獸族"
  ],
  "connections": [],
  "firstVolume": 13
 },
 {
  "id": "moDu",
  "name": "魔域（夜陽王朝）",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "魔修聚居的獨立界域，設有八個子區域（南荒域、臨聖域、墨海域等，待考完整名稱）；夜陽城為中心。",
  "factions": [
   "夜陽王朝"
  ],
  "connections": [],
  "firstVolume": 13
 },
 {
  "id": "huiJie",
  "name": "灰界",
  "tier": "immortal",
  "parentId": "xianJie",
  "description": "仙界平行界域，所有靈材、靈獸、土地均為灰色；天空三個太陽六個月亮；以煞氣為主；與仙界存在敵對關係，三大勢力鼎立（待考具體名稱）。",
  "factions": [
   "三大勢力（待考）"
  ],
  "connections": [],
  "firstVolume": 13
 }
];
