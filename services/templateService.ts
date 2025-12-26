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

  // 敌人名称前缀和后缀
  const namePrefixes = [
    '血', '玄', '幽', '暗', '邪', '魔', '妖', '鬼', '煞', '阴',
    '金', '银', '铁', '铜', '钢', '寒', '炎', '雷', '风', '冰',
    '毒', '影', '黑', '白', '赤', '青', '紫', '黄', '灰', '绿',
    '狂', '怒', '暴', '凶', '恶', '残', '嗜', '冷', '无', '绝',
  ];

  const nameSuffixes = [
    '狼', '虎', '豹', '蛇', '蛛', '鹰', '龙', '凤', '麒麟', '饕餮',
    '剑客', '刀客', '魔修', '邪修', '妖修', '鬼修', '散修', '老怪', '真人', '上人',
    '妖兽', '魔兽', '鬼物', '妖灵', '魔灵', '邪灵', '怨灵', '恶灵', '凶灵', '煞灵',
    '巨兽', '凶兽', '恶兽', '魔物', '邪物', '鬼怪', '妖魔', '邪魔', '魔头', '邪王',
  ];

  const titlePrefixes = [
    '荒原', '秘境', '邪道', '魔道', '妖道', '鬼道', '血道', '暗影', '幽冥', '阴煞',
    '残暴', '嗜血', '凶恶', '邪恶', '阴险', '狡诈', '狠毒', '冷酷', '无情', '凶残',
    '荒野', '古墓', '深渊', '地狱', '魔窟', '邪洞', '鬼域', '妖境', '魔界', '邪境',
  ];

  const titleSuffixes = [
    '妖兽', '魔兽', '邪修', '魔修', '妖修', '鬼修', '守卫', '守护者', '守护兽', '守护灵',
    '老怪', '真人', '上人', '散修', '魔头', '邪魔', '妖王', '鬼王', '魔王', '邪王',
    '巨兽', '凶兽', '恶兽', '魔物', '邪物', '鬼怪', '妖魔', '邪魔', '魔将', '邪将',
  ];

  // 为每个境界和历练类型组合生成名称
  realms.forEach(realm => {
    adventureTypes.forEach(adventureType => {
      const countPerCombination = Math.floor(500 / (realms.length * adventureTypes.length));

      for (let i = 0; i < countPerCombination; i++) {
        const namePrefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
        const nameSuffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
        const name = namePrefix + nameSuffix;

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
    const namePrefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
    const nameSuffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
    const name = namePrefix + nameSuffix;
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

