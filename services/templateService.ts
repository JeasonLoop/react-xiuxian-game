import { RealmType, AdventureType } from '../types';
import { REALM_ORDER } from '../constants';

/**
 * 突破描述模板接口
 */
export interface BreakthroughDescriptionTemplate {
  realm: string;
  template: string; // 使用 {playerName} 和 {realm} 作为占位符
}

/**
 * 敌人名称模板接口
 */
export interface EnemyNameTemplate {
  realm: RealmType;
  adventureType: AdventureType;
  name: string;
  title: string;
}

/**
 * 突破描述模板库
 */
let breakthroughDescriptionLibrary: BreakthroughDescriptionTemplate[] = [];

/**
 * 敌人名称模板库
 */
let enemyNameLibrary: EnemyNameTemplate[] = [];

/**
 * 是否已初始化
 */
let isBreakthroughInitialized = false;
let isEnemyNameInitialized = false;

/**
 * 生成突破描述模板库（500个）
 */
export function generateBreakthroughDescriptionLibrary(): BreakthroughDescriptionTemplate[] {
  const templates: BreakthroughDescriptionTemplate[] = [];
  const realms = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '渡劫飞升'];

  // 每个境界生成约71个描述（500/7≈71）
  const descriptionsPerRealm = Math.floor(500 / realms.length);

  const baseTemplates: Record<string, string[]> = {
    '炼气期': [
      '{playerName}盘膝而坐，按照基础功法运转，体内微弱的灵气开始流动。随着灵气的积累，{playerName}感受到瓶颈的松动，成功突破到了{realm}！',
      '{playerName}静心凝神，引导体内稀薄的灵气冲击经脉。经过一番努力，灵气终于冲破阻碍，{playerName}成功踏入了{realm}的境界！',
      '{playerName}日复一日地修炼，体内灵气逐渐充盈。终于，在某个时刻，{playerName}感受到境界的突破，成功达到了{realm}！',
      '{playerName}运转基础心法，灵气在经脉中缓缓流动。随着修炼的深入，{playerName}成功突破了瓶颈，踏入了{realm}的境界！',
      '{playerName}在修炼中感受到灵气的增长，体内传来轻微的震动。经过不懈努力，{playerName}成功突破到了{realm}，修为略有精进！',
    ],
    '筑基期': [
      '{playerName}盘膝而坐，运转功法，体内灵气如溪流般汇聚。随着灵气的不断积累，{playerName}感受到根基的稳固，成功突破到了{realm}！周身灵气翻涌，实力明显提升。',
      '天地灵气缓缓汇聚，{playerName}闭目凝神，引导灵气冲击瓶颈。经脉中传来阵阵轻响，如细流汇入江河。终于，{playerName}突破了桎梏，踏入了{realm}的境界！',
      '{playerName}静坐修炼，周身泛起淡淡光华。体内灵气核心开始凝聚，灵气如泉水般涌入。伴随着一声轻喝，{playerName}成功突破到了{realm}，修为稳步提升！',
      '{playerName}运转心法，体内灵气如江河般奔腾不息。经脉在灵气的滋养下不断强化，最终突破了瓶颈。{playerName}成功踏入了{realm}的境界，根基更加稳固！',
      '{playerName}闭关修炼，日复一日地积累修为。终于，在某个清晨，{playerName}感受到瓶颈松动。全力冲击之下，{playerName}成功突破到了{realm}，出关时已是另一番天地！',
    ],
    '金丹期': [
      '{playerName}盘膝而坐，运转功法，体内灵气如江河般奔腾不息。随着一声轻喝，瓶颈应声而破，{playerName}成功突破到了{realm}！周身灵气翻涌，实力大增。',
      '天地灵气汇聚，{playerName}闭目凝神，引导灵气冲击瓶颈。经脉中传来阵阵轰鸣，如雷鸣般震撼。终于，{playerName}突破了桎梏，踏入了{realm}的境界！',
      '{playerName}静坐洞府，周身霞光万丈。体内灵气核心剧烈震动，灵气如潮水般涌入。伴随着一声长啸，{playerName}成功突破到了{realm}，修为突飞猛进！',
      '{playerName}运转心法，体内灵气如火山爆发般喷涌而出。经脉在灵气的冲击下不断扩张，最终突破了瓶颈。{playerName}成功踏入了{realm}的境界，周身气息更加深邃。',
      '{playerName}服下灵丹，药力在体内化开。配合功法运转，{playerName}引导药力冲击瓶颈。在灵丹的辅助下，{playerName}成功突破到了{realm}，修为精进！',
    ],
    '元婴期': [
      '天地异象显现，{playerName}周身环绕着五彩霞光。体内灵气如龙蛇般游走，不断冲击着境界壁垒。终于，壁垒破碎，{playerName}成功突破到了{realm}，实力暴涨！',
      '{playerName}深入秘境，寻得一处灵脉。盘坐于灵脉之上，{playerName}运转功法，疯狂吸收天地灵气。随着灵气的不断涌入，{playerName}成功突破到了{realm}的境界！',
      '月夜之下，{playerName}立于山巅，引动天地灵气。星辰之力汇聚而来，化作一道光柱直冲云霄。{playerName}在灵气的洗礼下，成功突破到了{realm}，实力更上一层楼！',
      '{playerName}在战斗中感悟，生死搏杀中激发潜能。战斗中积累的感悟如潮水般涌来，{playerName}在战斗中突破，成功踏入了{realm}的境界！',
      '天地震动，{playerName}在突破的瞬间，体内传来阵阵龙吟。灵气如真龙般在经脉中游走，最终冲破桎梏。{playerName}成功突破到了{realm}，龙威显现！',
    ],
    '化神期': [
      '雷声轰鸣，{playerName}在雷劫中淬炼己身。天雷之力不断轰击，却无法撼动{playerName}的意志。最终，{playerName}在雷劫中涅槃重生，成功突破到了{realm}！',
      '星辰之力降临，{playerName}沐浴在星光之中。体内灵气与星辰之力交融，不断淬炼着肉身和神魂。最终，{playerName}在星辰之力的帮助下，成功突破到了{realm}！',
      '生死之间，{playerName}在绝境中领悟大道。体内灵气在生死边缘爆发，如凤凰涅槃般重生。{playerName}在绝境中突破，成功踏入了{realm}的境界！',
      '{playerName}寻得一处上古遗迹，在其中获得了传承。传承之力在体内爆发，{playerName}借助传承之力冲击瓶颈。在传承的帮助下，{playerName}成功突破到了{realm}的境界！',
      '天地变色，{playerName}周身环绕着强大的威压。神识如实质般显现，不断冲击着境界壁垒。终于，{playerName}的神识突破桎梏，成功踏入了{realm}的境界！',
    ],
    '炼虚期': [
      '虚空震动，{playerName}在虚空中淬炼己身。空间之力不断撕扯着肉身，却无法撼动{playerName}的意志。最终，{playerName}在虚空中涅槃重生，成功突破到了{realm}！',
      '天地法则显现，{playerName}周身环绕着法则之力。体内灵气与法则交融，不断淬炼着肉身和神魂。最终，{playerName}在法则的帮助下，成功突破到了{realm}！',
      '九天神雷降临，{playerName}在雷劫中淬炼己身。天雷之力不断轰击，却无法撼动{playerName}的意志。最终，{playerName}在雷劫中涅槃重生，成功突破到了{realm}！',
      '天地异象显现，{playerName}周身环绕着仙光。体内灵气如仙气般流转，不断冲击着境界壁垒。终于，壁垒破碎，{playerName}成功突破到了{realm}，实力暴涨！',
      '{playerName}在虚空中感悟，空间之力不断涌入体内。肉身在空间之力的淬炼下不断强化，最终突破了瓶颈。{playerName}成功踏入了{realm}的境界，接近仙人！',
    ],
    '渡劫飞升': [
      '九天之上，雷劫降临！{playerName}在九重天劫中淬炼己身。天雷之力不断轰击，却无法撼动{playerName}的意志。最终，{playerName}在雷劫中涅槃重生，成功突破到了{realm}！',
      '天地法则显现，{playerName}周身环绕着仙光。体内灵气如仙气般流转，不断冲击着境界壁垒。终于，壁垒破碎，{playerName}成功突破到了{realm}，实力暴涨！',
      '虚空震动，{playerName}在虚空中感悟大道。空间之力不断涌入体内，肉身在空间之力的淬炼下不断强化。最终，{playerName}成功踏入了{realm}的境界，成仙之路已开启！',
      '九天神雷降临，{playerName}在雷劫中淬炼己身。天雷之力不断轰击，却无法撼动{playerName}的意志。最终，{playerName}在雷劫中涅槃重生，成功突破到了{realm}！',
      '天地异象显现，{playerName}周身环绕着仙光。体内灵气如仙气般流转，不断冲击着境界壁垒。终于，壁垒破碎，{playerName}成功突破到了{realm}，成仙之路已开启！',
    ],
  };

  // 为每个境界生成描述
  realms.forEach(realm => {
    const baseTemplatesForRealm = baseTemplates[realm] || baseTemplates['金丹期'];

    // 生成变体描述
    for (let i = 0; i < descriptionsPerRealm; i++) {
      const baseTemplate = baseTemplatesForRealm[i % baseTemplatesForRealm.length];

      // 通过添加变化来生成不同的描述
      const variations = [
        baseTemplate,
        baseTemplate.replace('盘膝而坐', '静坐于蒲团之上'),
        baseTemplate.replace('运转功法', '催动体内真元'),
        baseTemplate.replace('灵气', '真元'),
        baseTemplate.replace('瓶颈', '境界壁垒'),
        baseTemplate.replace('突破', '冲破'),
        baseTemplate.replace('成功', '终于'),
      ];

      const template = variations[i % variations.length];
      templates.push({
        realm,
        template,
      });
    }
  });

  // 确保总数达到500
  while (templates.length < 500) {
    const realm = realms[Math.floor(Math.random() * realms.length)];
    const baseTemplatesForRealm = baseTemplates[realm] || baseTemplates['金丹期'];
    const baseTemplate = baseTemplatesForRealm[Math.floor(Math.random() * baseTemplatesForRealm.length)];
    templates.push({
      realm,
      template: baseTemplate,
    });
  }

  return templates.slice(0, 500);
}

/**
 * 生成敌人名称模板库（500个）
 */
export function generateEnemyNameLibrary(): EnemyNameTemplate[] {
  const templates: EnemyNameTemplate[] = [];
  const realms: RealmType[] = REALM_ORDER;
  const adventureTypes: AdventureType[] = ['normal', 'lucky', 'secret_realm'];

  // 敌人名称前缀和后缀（参考修仙小说风格，大幅扩展）
  const namePrefixes = [
    // 基础属性
    '血', '玄', '幽', '暗', '邪', '魔', '妖', '鬼', '煞', '阴',
    '金', '银', '铁', '铜', '钢', '寒', '炎', '雷', '风', '冰',
    '毒', '影', '黑', '白', '赤', '青', '紫', '黄', '灰', '绿',
    '狂', '怒', '暴', '凶', '恶', '残', '嗜', '冷', '无', '绝',
    // 扩展属性
    '天', '地', '古', '老', '深', '远', '大', '小', '巨', '微',
    '虚', '空', '真', '假', '幻', '梦', '死', '生', '灭', '毁',
    '极', '至', '超', '绝', '神', '仙', '圣', '尊', '帝', '皇',
    '九', '万', '千', '百', '十', '一', '三', '五', '七', '八',
    '太', '上', '下', '中', '内', '外', '前', '后', '左', '右',
    '东', '南', '西', '北', '中', '极', '边', '域', '界', '境',
    // 状态描述
    '枯', '朽', '腐', '烂', '破', '碎', '裂', '断', '残', '缺',
    '新', '旧', '古', '今', '永', '恒', '瞬', '刹', '永', '久',
    '孤', '独', '寂', '寞', '空', '虚', '无', '有', '存', '在',
    // 情感色彩
    '悲', '喜', '哀', '乐', '苦', '甜', '酸', '辣', '痛', '痒',
    '爱', '恨', '情', '仇', '恩', '怨', '是', '非', '对', '错',
  ];

  const nameMiddles = [
    // 包含所有前缀
    ...namePrefixes,
    // 连接词和修饰词
    '之', '与', '和', '及', '同', '共', '齐', '并', '兼', '合',
    '而', '乃', '则', '若', '如', '似', '像', '仿', '拟', '类',
    '非', '不', '无', '未', '未', '已', '曾', '将', '要', '会',
    // 数量词
    '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '百', '千', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟',
    // 方位词
    '上', '下', '左', '右', '前', '后', '内', '外', '中', '间',
    '东', '南', '西', '北', '中', '央', '边', '角', '隅', '侧',
    // 时间词
    '古', '今', '昔', '往', '来', '未', '过', '去', '现', '在',
    '春', '夏', '秋', '冬', '晨', '暮', '昼', '夜', '日', '月',
  ];

  const nameSuffixes = [
    // 单字生物
    '狼', '虎', '豹', '蛇', '蛛', '鹰', '龙', '凤', '鸟', '兽',
    '虫', '鱼', '虾', '蟹', '龟', '鳖', '鳄', '蜥', '蟾', '蛙',
    '鼠', '兔', '狐', '狸', '猫', '狗', '熊', '象', '鹿', '马',
    '牛', '羊', '猪', '鸡', '鸭', '鹅', '鹤', '雁', '雀', '鸦',
    // 双字生物
    '麒麟', '饕餮', '混沌', '穷奇', '梼杌', '白泽', '毕方', '九尾', '三足', '四象',
    '妖兽', '魔兽', '神兽', '仙兽', '灵兽', '异兽', '凶兽', '恶兽', '巨兽', '古兽',
    '妖禽', '魔禽', '神禽', '仙禽', '灵禽', '异禽', '凶禽', '恶禽', '巨禽', '古禽',
    '妖虫', '魔虫', '神虫', '仙虫', '灵虫', '异虫', '凶虫', '恶虫', '巨虫', '古虫',
    // 修士职业
    '剑客', '刀客', '枪客', '戟客', '棍客', '鞭客', '锤客', '斧客', '弓客', '弩客',
    '魔修', '邪修', '妖修', '鬼修', '散修', '正修', '道修', '佛修', '儒修', '武修',
    '丹修', '器修', '符修', '阵修', '法修', '体修', '魂修', '神修', '仙修', '圣修',
    '老怪', '真人', '上人', '道人', '僧人', '儒生', '武者', '修士', '仙人', '圣人',
    // 身份地位
    '魔头', '邪王', '妖王', '鬼王', '魔王', '神王', '仙王', '圣王', '帝君', '天尊',
    '魔尊', '邪尊', '妖尊', '鬼尊', '魔尊', '神尊', '仙尊', '圣尊', '帝尊', '天君',
    '魔将', '邪将', '妖将', '鬼将', '魔将', '神将', '仙将', '圣将', '帝将', '天将',
    '魔子', '邪子', '妖子', '鬼子', '魔子', '神子', '仙子', '圣子', '帝子', '天子',
    // 灵体类
    '鬼物', '妖灵', '魔灵', '邪灵', '怨灵', '恶灵', '凶灵', '煞灵', '死灵', '亡灵',
    '精魂', '神魂', '仙魂', '魔魂', '妖魂', '鬼魂', '邪魂', '怨魂', '恶魂', '凶魂',
    '精魄', '神魄', '仙魄', '魔魄', '妖魄', '鬼魄', '邪魄', '怨魄', '恶魄', '凶魄',
    // 特殊后缀
    '之魂', '之影', '之灵', '之魔', '之妖', '之鬼', '之煞', '之怨', '之怒', '之狂',
    '之血', '之骨', '之肉', '之皮', '之毛', '之角', '之爪', '之牙', '之尾', '之翼',
    '之眼', '之耳', '之鼻', '之口', '之舌', '之喉', '之心', '之肝', '之肺', '之肾',
    '之体', '之身', '之形', '之态', '之貌', '之容', '之颜', '之色', '之味', '之声',
    // 武器类
    '剑', '刀', '枪', '戟', '棍', '鞭', '锤', '斧', '弓', '弩',
    '剑修', '刀修', '枪修', '戟修', '棍修', '鞭修', '锤修', '斧修', '弓修', '弩修',
    // 元素类
    '火', '水', '土', '木', '金', '风', '雷', '冰', '光', '暗',
    '火修', '水修', '土修', '木修', '金修', '风修', '雷修', '冰修', '光修', '暗修',
    // 特殊存在
    '傀儡', '机关', '法身', '化身', '分身', '残魂', '残念', '执念', '怨念', '恶念',
    '守护', '守卫', '护卫', '护法', '护道', '护宗', '护族', '护国', '护世', '护天',
  ];

  const titlePrefixes = [
    // 地点类
    '荒原', '秘境', '荒野', '古墓', '深渊', '地狱', '魔窟', '邪洞', '鬼域', '妖境',
    '魔界', '邪境', '仙界', '神界', '天界', '冥界', '阴间', '阳间', '人间', '凡间',
    '洞府', '仙府', '魔府', '妖府', '鬼府', '邪府', '古殿', '神殿', '魔殿', '妖殿',
    '古塔', '神塔', '魔塔', '妖塔', '古楼', '神楼', '魔楼', '妖楼', '古寺', '神寺',
    '古观', '神观', '魔观', '妖观', '古庙', '神庙', '魔庙', '妖庙', '古祠', '神祠',
    // 道路类
    '邪道', '魔道', '妖道', '鬼道', '血道', '死道', '生道', '仙道', '神道', '圣道',
    '剑道', '刀道', '枪道', '戟道', '棍道', '鞭道', '锤道', '斧道', '弓道', '弩道',
    // 属性类
    '暗影', '幽冥', '阴煞', '阳煞', '血煞', '死煞', '生煞', '魔煞', '妖煞', '鬼煞',
    '残暴', '嗜血', '凶恶', '邪恶', '阴险', '狡诈', '狠毒', '冷酷', '无情', '凶残',
    '狂暴', '暴虐', '残忍', '嗜杀', '嗜血', '嗜魂', '嗜魄', '嗜灵', '嗜神', '嗜仙',
    // 境界类
    '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '飞升',
    '地仙', '天仙', '真仙', '玄仙', '金仙', '太乙', '大罗', '混元', '圣人', '道祖',
    // 时间类
    '太古', '远古', '上古', '中古', '近古', '今古', '未来', '过去', '现在', '永恒',
    '千年', '万年', '亿年', '兆年', '永恒', '不朽', '不灭', '不死', '不坏', '不破',
    // 数量类
    '九重', '十重', '百重', '千重', '万重', '亿重', '兆重', '无限', '无尽', '无穷',
    '九层', '十层', '百层', '千层', '万层', '亿层', '兆层', '无限', '无尽', '无穷',
    // 方位类
    '东方', '南方', '西方', '北方', '中央', '极东', '极南', '极西', '极北', '极中',
    '上界', '下界', '左界', '右界', '前界', '后界', '内界', '外界', '中界', '边界',
  ];

  const titleSuffixes = [
    // 生物类
    '妖兽', '魔兽', '神兽', '仙兽', '灵兽', '异兽', '凶兽', '恶兽', '巨兽', '古兽',
    '妖禽', '魔禽', '神禽', '仙禽', '灵禽', '异禽', '凶禽', '恶禽', '巨禽', '古禽',
    '妖虫', '魔虫', '神虫', '仙虫', '灵虫', '异虫', '凶虫', '恶虫', '巨虫', '古虫',
    // 修士类
    '邪修', '魔修', '妖修', '鬼修', '散修', '正修', '道修', '佛修', '儒修', '武修',
    '丹修', '器修', '符修', '阵修', '法修', '体修', '魂修', '神修', '仙修', '圣修',
    '老怪', '真人', '上人', '道人', '僧人', '儒生', '武者', '修士', '仙人', '圣人',
    // 身份地位
    '魔头', '邪王', '妖王', '鬼王', '魔王', '神王', '仙王', '圣王', '帝君', '天尊',
    '魔尊', '邪尊', '妖尊', '鬼尊', '神尊', '仙尊', '圣尊', '帝尊', '天君', '地君',
    '魔将', '邪将', '妖将', '鬼将', '神将', '仙将', '圣将', '帝将', '天将', '地将',
    '魔子', '邪子', '妖子', '鬼子', '神子', '仙子', '圣子', '帝子', '天子', '地子',
    // 守护类
    '守卫', '守护者', '守护兽', '守护灵', '守护神', '守护仙', '守护圣', '守护帝', '守护天', '守护地',
    '护卫', '护法', '护道', '护宗', '护族', '护国', '护世', '护天', '护地', '护人',
    // 特殊存在
    '傀儡', '机关', '法身', '化身', '分身', '残魂', '残念', '执念', '怨念', '恶念',
    '魔物', '邪物', '鬼怪', '妖魔', '邪魔', '神魔', '仙魔', '圣魔', '帝魔', '天魔',
    '魔灵', '邪灵', '怨灵', '恶灵', '凶灵', '煞灵', '死灵', '亡灵', '精魂', '神魂',
    // 武器类
    '剑客', '刀客', '枪客', '戟客', '棍客', '鞭客', '锤客', '斧客', '弓客', '弩客',
    '剑修', '刀修', '枪修', '戟修', '棍修', '鞭修', '锤修', '斧修', '弓修', '弩修',
    // 元素类
    '火修', '水修', '土修', '木修', '金修', '风修', '雷修', '冰修', '光修', '暗修',
    '火灵', '水灵', '土灵', '木灵', '金灵', '风灵', '雷灵', '冰灵', '光灵', '暗灵',
  ];

  // 为每个境界和历练类型组合生成名称
  realms.forEach(realm => {
    adventureTypes.forEach(adventureType => {
      const countPerCombination = Math.floor(500 / (realms.length * adventureTypes.length));

      for (let i = 0; i < countPerCombination; i++) {
        // 生成2-6个字的名称
        const nameLength = Math.floor(Math.random() * 5) + 2; // 2-6个字
        let name = '';

        // 根据长度生成不同组合
        const parts: string[] = [];
        parts.push(namePrefixes[Math.floor(Math.random() * namePrefixes.length)]); // 至少一个前缀

        // 根据目标长度添加中间部分和后缀
        if (nameLength >= 3) {
          // 随机决定是否添加中间部分
          if (nameLength >= 4 && Math.random() < 0.5) {
            parts.push(nameMiddles[Math.floor(Math.random() * nameMiddles.length)]);
          }
          if (nameLength >= 5 && Math.random() < 0.3) {
            parts.push(nameMiddles[Math.floor(Math.random() * nameMiddles.length)]);
          }
        }

        // 选择合适长度的后缀
        const remainingLength = nameLength - parts.join('').length;
        let suffix = '';
        if (remainingLength === 1) {
          const oneCharSuffixes = nameSuffixes.filter(s => s.length === 1);
          suffix = oneCharSuffixes.length > 0
            ? oneCharSuffixes[Math.floor(Math.random() * oneCharSuffixes.length)]
            : nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)].charAt(0);
        } else if (remainingLength === 2) {
          const twoCharSuffixes = nameSuffixes.filter(s => s.length === 2);
          suffix = twoCharSuffixes.length > 0
            ? twoCharSuffixes[Math.floor(Math.random() * twoCharSuffixes.length)]
            : nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)].substring(0, 2);
        } else if (remainingLength >= 3) {
          const multiCharSuffixes = nameSuffixes.filter(s => s.length >= 3);
          if (multiCharSuffixes.length > 0) {
            suffix = multiCharSuffixes[Math.floor(Math.random() * multiCharSuffixes.length)];
          } else {
            // 如果没有足够长的后缀，组合多个后缀
            const suffix1 = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
            const suffix2 = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
            suffix = suffix1 + suffix2;
          }
        } else {
          suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
        }

        // 如果总长度不够，添加更多前缀或中间部分
        name = parts.join('');
        while (name.length + suffix.length < nameLength) {
          if (Math.random() < 0.5) {
            name += namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
          } else {
            name += nameMiddles[Math.floor(Math.random() * nameMiddles.length)];
          }
        }

        // 如果总长度超过目标，截取
        name = (name + suffix).substring(0, nameLength);

        const titlePrefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
        const titleSuffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
        const title = titlePrefix + titleSuffix;

        templates.push({
          realm,
          adventureType,
          name,
          title,
        });
      }
    });
  });

  // 确保总数达到500
  while (templates.length < 500) {
    const realm = realms[Math.floor(Math.random() * realms.length)];
    const adventureType = adventureTypes[Math.floor(Math.random() * adventureTypes.length)];

    // 生成2-6个字的名称（使用相同的逻辑）
    const nameLength = Math.floor(Math.random() * 5) + 2; // 2-6个字
    let name = '';

    // 根据长度生成不同组合
    const parts: string[] = [];
    parts.push(namePrefixes[Math.floor(Math.random() * namePrefixes.length)]); // 至少一个前缀

    // 根据目标长度添加中间部分和后缀
    if (nameLength >= 3) {
      // 随机决定是否添加中间部分
      if (nameLength >= 4 && Math.random() < 0.5) {
        parts.push(nameMiddles[Math.floor(Math.random() * nameMiddles.length)]);
      }
      if (nameLength >= 5 && Math.random() < 0.3) {
        parts.push(nameMiddles[Math.floor(Math.random() * nameMiddles.length)]);
      }
    }

    // 选择合适长度的后缀
    const remainingLength = nameLength - parts.join('').length;
    let suffix = '';
    if (remainingLength === 1) {
      const oneCharSuffixes = nameSuffixes.filter(s => s.length === 1);
      suffix = oneCharSuffixes.length > 0
        ? oneCharSuffixes[Math.floor(Math.random() * oneCharSuffixes.length)]
        : nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)].charAt(0);
    } else if (remainingLength === 2) {
      const twoCharSuffixes = nameSuffixes.filter(s => s.length === 2);
      suffix = twoCharSuffixes.length > 0
        ? twoCharSuffixes[Math.floor(Math.random() * twoCharSuffixes.length)]
        : nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)].substring(0, 2);
    } else if (remainingLength >= 3) {
      const multiCharSuffixes = nameSuffixes.filter(s => s.length >= 3);
      if (multiCharSuffixes.length > 0) {
        suffix = multiCharSuffixes[Math.floor(Math.random() * multiCharSuffixes.length)];
      } else {
        // 如果没有足够长的后缀，组合多个后缀
        const suffix1 = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
        const suffix2 = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
        suffix = suffix1 + suffix2;
      }
    } else {
      suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
    }

    // 如果总长度不够，添加更多前缀或中间部分
    name = parts.join('');
    while (name.length + suffix.length < nameLength) {
      if (Math.random() < 0.5) {
        name += namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
      } else {
        name += nameMiddles[Math.floor(Math.random() * nameMiddles.length)];
      }
    }

    // 如果总长度超过目标，截取
    name = (name + suffix).substring(0, nameLength);

    const titlePrefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
    const titleSuffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
    const title = titlePrefix + titleSuffix;

    templates.push({
      realm,
      adventureType,
      name,
      title,
    });
  }

  return templates.slice(0, 500);
}

/**
 * 获取随机突破描述
 */
export function getRandomBreakthroughDescription(
  realm: string,
  playerName?: string
): string {
  if (breakthroughDescriptionLibrary.length === 0) {
    // 如果没有模板，返回默认描述
    const name = playerName || '你';
    const realmName = realm.includes('第') ? realm.split('第')[0].trim() : realm;
    return `${name}成功突破到了${realm}！`;
  }

  // 提取境界名称（去除"第X层"）
  const realmName = realm.includes('第') ? realm.split('第')[0].trim() : realm;

  // 筛选对应境界的模板
  const realmTemplates = breakthroughDescriptionLibrary.filter(
    t => t.realm === realmName
  );

  // 如果没有对应境界的模板，使用所有模板
  const templates = realmTemplates.length > 0
    ? realmTemplates
    : breakthroughDescriptionLibrary;

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  const name = playerName || '你';

  return randomTemplate.template
    .replace(/{playerName}/g, name)
    .replace(/{realm}/g, realm);
}

/**
 * 获取随机敌人名称
 */
export function getRandomEnemyName(
  realm: RealmType,
  adventureType: AdventureType
): { name: string; title: string } {
  if (enemyNameLibrary.length === 0) {
    // 如果没有模板，返回默认名称
    return { name: '未知敌人', title: '荒野妖兽' };
  }

  // 筛选对应境界和历练类型的模板
  const matchingTemplates = enemyNameLibrary.filter(
    t => t.realm === realm && t.adventureType === adventureType
  );

  // 如果没有匹配的模板，使用所有模板
  const templates = matchingTemplates.length > 0
    ? matchingTemplates
    : enemyNameLibrary;

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  return {
    name: randomTemplate.name,
    title: randomTemplate.title,
  };
}

/**
 * 设置突破描述模板库
 */
export function setBreakthroughDescriptionLibrary(templates: BreakthroughDescriptionTemplate[]): void {
  breakthroughDescriptionLibrary = templates;
  isBreakthroughInitialized = true;
}

/**
 * 获取突破描述模板库
 */
export function getBreakthroughDescriptionLibrary(): BreakthroughDescriptionTemplate[] {
  return breakthroughDescriptionLibrary;
}

/**
 * 检查突破描述模板库是否已初始化
 */
export function isBreakthroughDescriptionLibraryInitialized(): boolean {
  return isBreakthroughInitialized && breakthroughDescriptionLibrary.length > 0;
}

/**
 * 设置敌人名称模板库
 */
export function setEnemyNameLibrary(templates: EnemyNameTemplate[]): void {
  enemyNameLibrary = templates;
  isEnemyNameInitialized = true;
}

/**
 * 获取敌人名称模板库
 */
export function getEnemyNameLibrary(): EnemyNameTemplate[] {
  return enemyNameLibrary;
}

/**
 * 检查敌人名称模板库是否已初始化
 */
export function isEnemyNameLibraryInitialized(): boolean {
  return isEnemyNameInitialized && enemyNameLibrary.length > 0;
}

