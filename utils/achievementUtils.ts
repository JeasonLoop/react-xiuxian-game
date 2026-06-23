import { ACHIEVEMENTS } from '../constants';

const GLOBAL_ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));

export const getGlobalAchievementIds = (achievementIds: string[] = []): string[] => {
  return Array.from(
    new Set(achievementIds.filter((id) => GLOBAL_ACHIEVEMENT_IDS.has(id)))
  );
};

export const getUnviewedGlobalAchievementIds = (
  achievementIds: string[] = [],
  viewedAchievementIds: string[] = []
): string[] => {
  const viewed = new Set(viewedAchievementIds);
  return getGlobalAchievementIds(achievementIds).filter((id) => !viewed.has(id));
};
