import assert from 'node:assert/strict';
import { GAME_BALANCE, getLotteryPityProgress, LOTTERY_RARE_PITY_INTERVAL, LOTTERY_SOFT_PITY_LEGEND_INTERVAL } from '../constants/index';
import { getLocalDateString } from '../utils/dateUtils';

function main() {
  assert.equal(GAME_BALANCE.meditation.enlightenmentMin, 3);
  assert.equal(GAME_BALANCE.meditation.enlightenmentMax, 5);
  assert.equal(GAME_BALANCE.meditation.autoIntervalMs, 1500);
  assert.ok(GAME_BALANCE.meditation.autoEnlightenmentChance < GAME_BALANCE.meditation.manualEnlightenmentChance);
  assert.equal(GAME_BALANCE.hunt.encounterChance, 0.3);
  assert.equal(GAME_BALANCE.hunt.levelUpHours, 24);
  assert.equal(GAME_BALANCE.dailyQuest.countMin, 5);
  assert.equal(GAME_BALANCE.dailyQuest.countMax, 8);
  assert.deepEqual([...GAME_BALANCE.dailyQuest.coreTypes], ['meditate', 'adventure', 'sect', 'alchemy', 'pet']);

  assert.equal(GAME_BALANCE.autoAdventure.cooldown, 1);
  assert.deepEqual(getLotteryPityProgress(0), { rareRemain: LOTTERY_RARE_PITY_INTERVAL, legendRemain: LOTTERY_SOFT_PITY_LEGEND_INTERVAL });
  assert.deepEqual(getLotteryPityProgress(9), { rareRemain: 1, legendRemain: 41 });
  assert.deepEqual(getLotteryPityProgress(10), { rareRemain: 10, legendRemain: 40 });
  assert.deepEqual(getLotteryPityProgress(50), { rareRemain: 10, legendRemain: 50 });

  const local = getLocalDateString(new Date(2026, 0, 2, 1, 0, 0));
  assert.equal(local, '2026-01-02');
  console.log('gameplayBalance ok');

}

main();

