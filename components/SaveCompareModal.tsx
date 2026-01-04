import React from 'react';
import { TrendingUp, TrendingDown, Minus, GitCompare } from 'lucide-react';
import { compareSaves, SaveData, SaveComparison } from '../utils/saveManagerUtils';
import { formatNumber } from '../utils/formatUtils';
import dayjs from 'dayjs';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  save1: SaveData;
  save2: SaveData;
}

const SaveCompareModal: React.FC<Props> = ({ isOpen, onClose, save1, save2 }) => {
  const comparison: SaveComparison = compareSaves(save1, save2);

  const getDiff = (oldVal: number, newVal: number) => {
    const diff = newVal - oldVal;
    const percent = oldVal !== 0 ? ((diff / oldVal) * 100).toFixed(1) : '∞';
    return { diff, percent, isPositive: diff >= 0 };
  };

  const ComparisonRow = ({
    label,
    oldVal,
    newVal,
    format = (v: number) => v.toString(),
  }: {
    label: string;
    oldVal: number | string;
    newVal: number | string;
    format?: (v: number) => string;
  }) => {
    const isString = typeof oldVal === 'string' || typeof newVal === 'string';
    const oldNum = typeof oldVal === 'number' ? oldVal : 0;
    const newNum = typeof newVal === 'number' ? newVal : 0;
    const { diff, percent, isPositive } = isString
      ? { diff: 0, percent: '0', isPositive: true }
      : getDiff(oldNum, newNum);

    return (
      <tr className="border-b border-stone-700">
        <td className="px-4 py-2 text-stone-300">{label}</td>
        <td className="px-4 py-2 text-stone-400 text-right">
          {isString ? oldVal : format(oldNum)}
        </td>
        <td className="px-4 py-2 text-stone-400 text-right">
          {isString ? newVal : format(newNum)}
        </td>
        <td className="px-4 py-2 text-right">
          {!isString && (
            <div className="flex items-center justify-end gap-1">
              {diff !== 0 ? (
                <>
                  {isPositive ? (
                    <TrendingUp size={16} className="text-green-400" />
                  ) : (
                    <TrendingDown size={16} className="text-red-400" />
                  )}
                  <span
                    className={
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {isPositive ? '+' : ''}
                    {format(diff)} ({percent}%)
                  </span>
                </>
              ) : (
                <>
                  <Minus size={16} className="text-stone-500" />
                  <span className="text-stone-500">无变化</span>
                </>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="存档对比"
      titleIcon={<GitCompare size={20} className="text-mystic-gold" />}
      size="4xl"
      height="full"
    >
      {/* 基本信息对比 */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-stone-300 mb-3">
          基本信息
        </h3>
        <div className="bg-stone-900 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-stone-500 mb-1">存档1</div>
              <div className="text-stone-200">
                {comparison.playerName.old}
              </div>
              <div className="text-sm text-stone-400">
                {comparison.realm.old} {comparison.realmLevel.old}层
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {dayjs(comparison.timestamp.old).format(
                  'YYYY-MM-DD HH:mm:ss'
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500 mb-1">存档2</div>
              <div className="text-stone-200">
                {comparison.playerName.new}
              </div>
              <div className="text-sm text-stone-400">
                {comparison.realm.new} {comparison.realmLevel.new}层
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {dayjs(comparison.timestamp.new).format(
                  'YYYY-MM-DD HH:mm:ss'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 属性对比表格 */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-stone-300 mb-3">
          属性对比
        </h3>
        <div className="bg-stone-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-800 border-b border-stone-700">
                <th className="px-4 py-2 text-left text-stone-300">属性</th>
                <th className="px-4 py-2 text-right text-stone-300">
                  存档1
                </th>
                <th className="px-4 py-2 text-right text-stone-300">
                  存档2
                </th>
                <th className="px-4 py-2 text-right text-stone-300">
                  差异
                </th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                label="境界等级"
                oldVal={comparison.realmLevel.old}
                newVal={comparison.realmLevel.new}
              />
              <ComparisonRow
                label="经验值"
                oldVal={comparison.exp.old}
                newVal={comparison.exp.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="最大经验"
                oldVal={comparison.maxExp.old}
                newVal={comparison.maxExp.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="生命值"
                oldVal={comparison.hp.old}
                newVal={comparison.hp.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="最大生命"
                oldVal={comparison.maxHp.old}
                newVal={comparison.maxHp.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="攻击力"
                oldVal={comparison.attack.old}
                newVal={comparison.attack.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="防御力"
                oldVal={comparison.defense.old}
                newVal={comparison.defense.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="灵力"
                oldVal={comparison.spirit.old}
                newVal={comparison.spirit.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="体质"
                oldVal={comparison.physique.old}
                newVal={comparison.physique.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="速度"
                oldVal={comparison.speed.old}
                newVal={comparison.speed.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="灵石"
                oldVal={comparison.spiritStones.old}
                newVal={comparison.spiritStones.new}
                format={formatNumber}
              />
              <ComparisonRow
                label="背包物品数"
                oldVal={comparison.inventoryCount.old}
                newVal={comparison.inventoryCount.new}
              />
              <ComparisonRow
                label="装备数量"
                oldVal={comparison.equipmentCount.old}
                newVal={comparison.equipmentCount.new}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* 时间信息 */}
      <div className="text-xs text-stone-500 text-center">
        存档1保存时间: {dayjs(comparison.timestamp.old).format('YYYY-MM-DD HH:mm:ss')}
        <br />
        存档2保存时间: {dayjs(comparison.timestamp.new).format('YYYY-MM-DD HH:mm:ss')}
        <br />
        时间差: {dayjs(comparison.timestamp.new).diff(dayjs(comparison.timestamp.old), 'hour')} 小时
      </div>
    </Modal>
  );
};

export default SaveCompareModal;
