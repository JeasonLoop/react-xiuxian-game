import { RealmType, AdventureType } from '../types';
import { REALM_ORDER } from '../constants/index';

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

  // ===== 词库：按语义分类组合，避免"甜狼""过去真人"式乱拼 =====

  // 妖兽：修饰词 + 本体
  const beastModifiers = [
    '血', '玄', '幽', '暗', '赤', '青', '紫', '金', '银', '铁',
    '寒', '炎', '雷', '风', '冰', '毒', '影', '狂', '凶', '黑',
    '裂地', '噬魂', '碎骨', '穿云', '追风', '啸月', '吞火', '饮血',
  ];
  const beastNames = [
    '狼', '虎', '豹', '蛇', '蛛', '鹰', '蟒', '狮', '鸦', '狐',
    '熊', '鳄', '龟', '猿', '蜥', '蝎', '蜂', '雕', '蛟', '蟾',
    '妖狼', '魔猿', '火鸦', '冰蟒', '雷鹰', '血蝠', '毒蛛', '玄龟', '铁甲虫', '噬金蚁',
  ];

  // 人形修士：作风 + 身份
  const humanModifiers = ['狂傲', '冷酷', '阴沉', '落魄', '独眼', '断臂', '白袍', '灰袍', '跛脚', '无面'];
  const humanNames = ['剑客', '刀客', '散修', '武者', '道人', '药师', '猎户', '游侠', '镖头', '武僧'];

  // 邪道修士：脾性 + 身份
  const evilModifiers = ['嗜血', '阴狠', '暴戾', '诡诈', '疯癫', '贪戾', '狠辣', '乖张'];
  const evilNames = ['魔修', '邪修', '鬼修', '妖修', '魔头', '妖王', '鬼将', '魔将', '血奴', '尸傀', '魔人'];

  // 灵体：氛围 + 形态
  const spiritModifiers = ['怨', '煞', '枯', '腐', '哀', '泣', '断魂', '缠丝', '引路', '守夜'];
  const spiritNames = ['怨灵', '恶灵', '亡魂', '鬼物', '煞灵', '残魂', '幽魂', '厉鬼', '阴灵', '尸魅'];

  // 高境界专属：威权修士 / 上古神兽
  const lordNames = ['魔尊', '妖尊', '鬼尊', '天将', '魔君', '妖君', '老怪', '老祖', '真君', '天魔'];
  const divineModifiers = ['太古', '上古', '荒古', '始祖', '九天', '玄天'];
  const divineBeasts = [
    '真龙', '凤凰', '玄武', '白虎', '麒麟', '饕餮', '穷奇', '梼杌', '毕方', '九婴',
    '古兽', '天鹏', '荒兽', '神猿',
  ];

  // 机缘历练：正道人物 / 灵兽
  const luckyBeastNames = ['灵鹤', '仙鹿', '白狐', '灵猿', '仙鹤', '玉兔', '锦鲤', '灵雀'];
  const luckyHumanNames = ['道人', '真人', '仙师', '药童', '剑仙', '隐士'];

  // 秘境历练：守护兽 / 造物
  const secretBeastNames = ['古兽', '石像鬼', '守陵兽', '镇墓兽', '傀儡兽'];
  const secretSpecialNames = ['石傀儡', '铁傀儡', '机关兽', '守护残魂', '阵法之灵', '守卫法身'];

  // 称号前缀（按历练类型，未覆盖的类型兜底 normal）
  const titlePrefixes: Record<string, string[]> = {
    normal: ['荒野', '荒原', '黑风岭', '乱葬岗', '枯骨滩', '黑水泽', '断魂崖', '迷雾林', '古墓', '废弃矿洞', '荒山', '野岭'],
    lucky: ['灵溪', '灵山', '仙府', '福地', '药谷', '云梦泽', '百花谷', '灵泉洞', '瑶池', '仙踪林'],
    secret_realm: ['秘境', '上古遗迹', '禁地', '虚空裂隙', '远古战场', '无名遗迹', '封魔洞', '锁妖塔', '阵法残域'],
  };
  // 称号后缀（与名字类别保持一致，避免"阳间真人血牙狼"式错配）
  const titleSuffixes: Record<string, string[]> = {
    beast: ['妖兽', '凶兽', '魔兽', '灵兽', '异兽'],
    human: ['修士', '武者', '散修'],
    evil: ['魔修', '邪修', '魔头', '妖人'],
    spirit: ['阴煞', '鬼祟', '凶灵', '邪祟'],
    lord: ['魔尊', '妖尊', '老祖', '魔君'],
    divine: ['神兽', '古兽', '圣兽', '荒兽'],
    secret: ['守卫', '守护者', '阵灵'],
  };

  // 随机取一个元素
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // 修饰词 + 基础词拼接，字词重叠时退回基础词（避免"血血蝠""嗜血血奴"式名字）
  const combine = (modifiers: string[], base: string): string => {
    const mod = pick(modifiers);
    const clash = Array.from(mod).some(ch => base.includes(ch));
    return clash ? base : mod + base;
  };

  // 境界分档：低境界以妖兽/散修为主，高境界出现魔尊/上古神兽
  const tierOf = (realm: RealmType): 'early' | 'mid' | 'late' => {
    const idx = realms.indexOf(realm);
    return idx <= 1 ? 'early' : idx <= 4 ? 'mid' : 'late';
  };

  // 生成一个敌人的名字与称号（称号与名字类别保持一致）
  const makeEnemy = (
    realm: RealmType,
    adventureType: AdventureType
  ): { name: string; title: string } => {
    const tier = tierOf(realm);

    // 名字类别权重池
    const categories: string[] = ['beast', 'beast', 'human', 'human'];
    if (tier === 'mid') categories.push('evil', 'evil', 'spirit');
    if (tier === 'late') categories.push('evil', 'spirit', 'lord', 'lord', 'divine', 'divine');
    if (adventureType === 'lucky') categories.push('luckyBeast', 'luckyHuman');
    if (adventureType === 'secret_realm') categories.push('secretBeast', 'secretSpecial', 'secretSpecial');
    const category = pick(categories);

    let name = '';
    let titleKey = category;
    switch (category) {
      case 'beast': {
        const beast = pick(beastNames);
        // 单字本体必须带修饰词，保证名字至少两个字
        name = beast.length === 1 || Math.random() < 0.7 ? combine(beastModifiers, beast) : beast;
        break;
      }
      case 'human':
        name = Math.random() < 0.5 ? combine(humanModifiers, pick(humanNames)) : pick(humanNames);
        break;
      case 'evil':
        name = combine(evilModifiers, pick(evilNames));
        break;
      case 'spirit':
        name = Math.random() < 0.6 ? combine(spiritModifiers, pick(spiritNames)) : pick(spiritNames);
        break;
      case 'lord':
        name = combine(Math.random() < 0.5 ? evilModifiers : divineModifiers, pick(lordNames));
        break;
      case 'divine':
        name = combine(divineModifiers, pick(divineBeasts));
        break;
      case 'luckyBeast':
        name = pick(luckyBeastNames);
        titleKey = 'beast';
        break;
      case 'luckyHuman':
        name = pick(luckyHumanNames);
        titleKey = 'human';
        break;
      case 'secretBeast':
        name = combine(divineModifiers, pick(secretBeastNames));
        titleKey = 'beast';
        break;
      default: // secretSpecial
        name = pick(secretSpecialNames);
        titleKey = 'secret';
        break;
    }

    // 称号后缀避开名字里已有的词，避免"魔头嗜血魔头"式重复
    const suffixes = titleSuffixes[titleKey].filter(s => !name.includes(s));
    const prefixes = titlePrefixes[adventureType] || titlePrefixes.normal;
    return { name, title: pick(prefixes) + (suffixes.length > 0 ? pick(suffixes) : '') };
  };

  // 为每个境界和历练类型组合生成名称
  const countPerCombination = Math.floor(500 / (realms.length * adventureTypes.length));
  realms.forEach(realm => {
    adventureTypes.forEach(adventureType => {
      for (let i = 0; i < countPerCombination; i++) {
        const { name, title } = makeEnemy(realm, adventureType);
        templates.push({ realm, adventureType, name, title });
      }
    });
  });

  // 确保总数达到500
  while (templates.length < 500) {
    const realm = pick(realms);
    const adventureType = pick(adventureTypes);
    const { name, title } = makeEnemy(realm, adventureType);
    templates.push({ realm, adventureType, name, title });
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

