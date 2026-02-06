import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { X, Save, Trash2, Download, Upload, Copy, RotateCcw, FileText, Cloud, CloudUpload, CloudDownload } from 'lucide-react';
import {
  getAllSlots,
  loadFromSlot,
  saveToSlot,
  deleteSlot,
  getBackups,
  restoreFromBackup,
  createBackup,
  SaveSlot,
  SaveData,
  exportSave,
  importSave,
  getCurrentSlotId,
  setCurrentSlotId,
} from '../utils/saveManagerUtils';
import { showError, showSuccess, showConfirm, showInfo } from '../utils/toastUtils';
import { PlayerStats, LogEntry } from '../types';
import dayjs from 'dayjs';
import { apiService, GameSave as CloudSave } from '../services/apiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: PlayerStats | null;
  currentLogs: LogEntry[];
  onLoadSave: (player: PlayerStats, logs: LogEntry[]) => void;
  onCompareSaves?: (save1: SaveData, save2: SaveData) => void;
}

const SaveManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPlayer,
  currentLogs,
  onLoadSave,
  onCompareSaves,
}) => {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showBackups, setShowBackups] = useState<number | null>(null);
  const [backups, setBackups] = useState<SaveData[]>([]);
  const [currentSlotId, setCurrentSlotIdState] = useState<number>(1);
  const [cloudSaves, setCloudSaves] = useState<Record<number, CloudSave>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      refreshSlots();
      setCurrentSlotIdState(getCurrentSlotId());
      checkLoginAndFetchCloud();
    }
  }, [isOpen]);

  const checkLoginAndFetchCloud = async () => {
    const loggedIn = apiService.isLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      try {
        const saves = await apiService.getCloudSaves();
        const savesMap: Record<number, CloudSave> = {};
        saves.forEach(s => savesMap[s.slotId] = s);
        setCloudSaves(savesMap);
      } catch (e) {
        console.error('Failed to fetch cloud saves', e);
      }
    }
  };

  const refreshSlots = () => {
    const allSlots = getAllSlots();
    setSlots(allSlots);
  };

  const handleSaveToSlot = (slotId: number) => {
    if (!currentPlayer) {
      showError('没有可保存的游戏数据！');
      return;
    }

    showConfirm(
      `确定要保存到存档${slotId}吗？\n\n如果该槽位已有存档，将被覆盖。`,
      '确认保存',
      () => {
        const success = saveToSlot(slotId, currentPlayer, currentLogs);
        if (success) {
          showSuccess(`已保存到存档${slotId}！`);
          refreshSlots();
          setCurrentSlotIdState(slotId);
        } else {
          showError('保存失败，请重试！');
        }
      }
    );
  };

  const handleLoadFromSlot = (slotId: number) => {
    const saveData = loadFromSlot(slotId);
    if (!saveData) {
      showError('该存档槽位为空！');
      return;
    }

    showConfirm(
      `确定要加载存档${slotId}吗？\n\n玩家: ${saveData.player.name}\n境界: ${saveData.player.realm}\n保存时间: ${dayjs(saveData.timestamp).format('YYYY-MM-DD HH:mm:ss')}\n\n当前游戏进度将被替换，页面将自动刷新。`,
      '确认加载',
      () => {
        onLoadSave(saveData.player, saveData.logs);
        setCurrentSlotIdState(slotId);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    );
  };

  const handleDeleteSlot = (slotId: number) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.data) {
      showError('该存档槽位为空！');
      return;
    }

    showConfirm(
      `确定要删除存档${slotId}吗？\n\n玩家: ${slot.playerName}\n境界: ${slot.realm}\n\n此操作无法撤销！`,
      '确认删除',
      () => {
        const success = deleteSlot(slotId);
        if (success) {
          showSuccess(`已删除存档${slotId}！`);
          refreshSlots();
          if (currentSlotId === slotId) {
            setCurrentSlotIdState(1);
            setCurrentSlotId(1);
          }
        } else {
          showError('删除失败，请重试！');
        }
      }
    );
  };

  const handleExportSlot = (slotId: number) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.data) {
      showError('该存档槽位为空！');
      return;
    }

    try {
      const jsonString = exportSave(slot.data);
      const fileName = `xiuxian-save-slot${slotId}-${slot.playerName}-${dayjs(slot.timestamp).format('YYYY-MM-DD HH-mm-ss')}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('存档导出成功！');
    } catch (error) {
      console.error('导出存档失败:', error);
      showError('导出存档失败！');
    }
  };

  const handleImportToSlot = async (event: React.ChangeEvent<HTMLInputElement>, slotId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('请选择 .json 或 .txt 格式的存档文件！');
      return;
    }

    try {
      const text = await file.text();
      const saveData = importSave(text);

      if (!saveData) {
        showError('存档文件格式错误！');
        return;
      }

      const playerName = saveData.player.name || '未知';
      const realm = saveData.player.realm || '未知';
      const timestamp = saveData.timestamp
        ? dayjs(saveData.timestamp).format('YYYY-MM-DD HH:mm:ss')
        : '未知';

      showConfirm(
        `确定要导入到存档${slotId}吗？\n\n玩家名称: ${playerName}\n境界: ${realm}\n保存时间: ${timestamp}\n\n如果该槽位已有存档，将被覆盖。`,
        '确认导入',
        () => {
          const success = saveToSlot(slotId, saveData.player, saveData.logs);
          if (success) {
            showSuccess(`已导入到存档${slotId}！`);
            refreshSlots();
          } else {
            showError('导入失败，请重试！');
          }
        }
      );
    } catch (error) {
      console.error('导入存档失败:', error);
      showError('导入存档失败！');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShowBackups = (slotId: number) => {
    if (showBackups === slotId) {
      setShowBackups(null);
      setBackups([]);
    } else {
      const slotBackups = getBackups(slotId);
      setBackups(slotBackups);
      setShowBackups(slotId);
    }
  };

  const handleCreateBackup = (slotId: number) => {
    if (!currentPlayer || currentSlotId !== slotId) {
      showError('请先加载该存档槽位！');
      return;
    }

    const success = createBackup(slotId);
    if (success) {
      showSuccess('备份创建成功！');
      if (showBackups === slotId) {
        setBackups(getBackups(slotId));
      }
    } else {
      showError('备份创建失败！');
    }
  };

  const handleRestoreBackup = (slotId: number, backupIndex: number) => {
    showConfirm(
      `确定要从备份恢复存档${slotId}吗？\n\n当前存档将被备份覆盖，页面将自动刷新。`,
      '确认恢复',
      () => {
        const success = restoreFromBackup(slotId, backupIndex);
        if (success) {
          showSuccess('备份恢复成功！');
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          showError('备份恢复失败！');
        }
      }
    );
  };

  const handleCompareSaves = (slotId1: number, slotId2: number) => {
    const slot1 = slots.find((s) => s.id === slotId1);
    const slot2 = slots.find((s) => s.id === slotId2);

    if (!slot1 || !slot1.data || !slot2 || !slot2.data) {
      showError('请选择两个有效的存档进行对比！');
      return;
    }

    if (onCompareSaves) {
      onCompareSaves(slot1.data, slot2.data);
    }
  };

  // Cloud Save Handlers
  const handleUploadToCloud = async (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || !slot.data) {
        showError('该槽位没有存档可上传！');
        return;
    }

    try {
        const saveDataStr = exportSave(slot.data);
        const summary = `${slot.playerName} - ${slot.realm} ${slot.realmLevel}层`;
        await apiService.uploadSave(slotId, saveDataStr, summary);
        showSuccess('云端存档上传成功！');
        checkLoginAndFetchCloud(); // Refresh
    } catch (e: any) {
        showError('上传失败: ' + e.message);
    }
  };

  const handleDownloadFromCloud = async (slotId: number) => {
    const cloudSave = cloudSaves[slotId];
    if (!cloudSave) {
        showError('云端该槽位没有存档！');
        return;
    }

    try {
        const saveData = importSave(cloudSave.saveData);
        if (!saveData) {
            showError('云端存档格式错误！');
            return;
        }

        showConfirm(
            `确定要从云端下载到槽位${slotId}吗？\n\n云端描述: ${cloudSave.summary}\n更新时间: ${dayjs(cloudSave.updateTime).format('YYYY-MM-DD HH:mm')}\n\n本地该槽位存档将被覆盖！`,
            '确认下载',
            () => {
                const success = saveToSlot(slotId, saveData.player, saveData.logs);
                if (success) {
                    showSuccess('云端存档下载成功！');
                    refreshSlots();
                } else {
                    showError('保存到本地失败！');
                }
            }
        );
    } catch (e: any) {
        showError('下载失败: ' + e.message);
    }
  };

  const handleDeleteCloudSave = async (slotId: number) => {
    showConfirm(
        `确定要删除云端槽位${slotId}的存档吗？\n此操作不可撤销！`,
        '确认删除',
        async () => {
            try {
                await apiService.deleteCloudSave(slotId);
                showSuccess('云端存档删除成功！');
                checkLoginAndFetchCloud();
            } catch (e: any) {
                showError('删除失败: ' + e.message);
            }
        }
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="存档管理"
      size="4xl"
      height="auto"
      containerClassName="bg-stone-800 border-stone-700"
      headerClassName="bg-stone-800 border-b border-stone-700"
      titleClassName="text-mystic-gold font-serif"
      contentClassName="bg-stone-800 space-y-4"
      contentPadding="p-4 md:p-6"
    >
          {!isLoggedIn && (
            <div className="bg-stone-900/50 p-2 text-center text-sm text-stone-400 rounded">
                <Cloud size={14} className="inline mr-1" />
                登录后可使用云存档功能
            </div>
          )}

          {/* 存档槽位列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot) => {
              const isEmpty = !slot.data;
              const isCurrent = currentSlotId === slot.id;
              const cloudSave = cloudSaves[slot.id];

              return (
                <div
                  key={slot.id}
                  className={`border rounded-lg p-4 ${
                    isEmpty
                      ? 'border-stone-700 bg-stone-900/50'
                      : isCurrent
                        ? 'border-mystic-gold bg-stone-900'
                        : 'border-stone-600 bg-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-200">
                          存档{slot.id}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-mystic-gold text-stone-900 px-2 py-0.5 rounded">
                            当前
                          </span>
                        )}
                        {isEmpty && (
                          <span className="text-xs text-stone-500">空槽位</span>
                        )}
                      </div>
                      {!isEmpty && (
                        <div className="text-sm text-stone-400 space-y-1">
                          <div>玩家: {slot.playerName}</div>
                          <div>境界: {slot.realm} {slot.realmLevel}层</div>
                          <div className="text-xs">
                            {dayjs(slot.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* 云存档状态指示 */}
                    {isLoggedIn && (
                        <div className="flex flex-col items-end">
                            {cloudSave ? (
                                <span className="text-xs text-emerald-400 flex items-center gap-1" title={cloudSave.summary}>
                                    <Cloud size={12} />
                                    已同步
                                </span>
                            ) : (
                                <span className="text-xs text-stone-600 flex items-center gap-1">
                                    <Cloud size={12} />
                                    未同步
                                </span>
                            )}
                        </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {!isEmpty && (
                      <>
                        <button
                          onClick={() => handleLoadFromSlot(slot.id)}
                          className="flex-1 min-w-[60px] bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1"
                          title="加载本地存档"
                        >
                          <Save size={14} />
                          加载
                        </button>
                        <button
                          onClick={() => handleExportSlot(slot.id)}
                          className="flex-1 min-w-[60px] bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1"
                          title="导出为文件"
                        >
                          <Download size={14} />
                          导出
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="flex-1 min-w-[60px] bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1"
                          title="删除本地存档"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                        <button
                          onClick={() => handleShowBackups(slot.id)}
                          className="flex-1 min-w-[60px] bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1"
                          title="查看本地备份"
                        >
                          <Copy size={14} />
                          备份
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleSaveToSlot(slot.id)}
                      className="flex-1 min-w-[60px] bg-stone-600 hover:bg-stone-700 text-white text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1"
                      disabled={!currentPlayer}
                      title="保存到该槽位"
                    >
                      <Save size={14} />
                      {isEmpty ? '保存' : '覆盖'}
                    </button>
                    <label className="flex-1 min-w-[60px] bg-stone-600 hover:bg-stone-700 text-white text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer" title="从文件导入">
                      <Upload size={14} />
                      导入
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.txt"
                        onChange={(e) => handleImportToSlot(e, slot.id)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 云存档按钮 */}
                  {isLoggedIn && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-stone-700/50">
                          <button
                            onClick={() => handleUploadToCloud(slot.id)}
                            className={`flex-1 text-xs px-2 py-1 rounded flex items-center justify-center gap-1 ${isEmpty ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900'}`}
                            disabled={isEmpty}
                            title="上传本地存档到云端"
                          >
                            <CloudUpload size={14} />
                            上传
                          </button>
                          <button
                            onClick={() => handleDownloadFromCloud(slot.id)}
                            className={`flex-1 text-xs px-2 py-1 rounded flex items-center justify-center gap-1 ${!cloudSave ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : 'bg-blue-900/50 text-blue-400 hover:bg-blue-900'}`}
                            disabled={!cloudSave}
                            title="从云端下载存档覆盖本地"
                          >
                            <CloudDownload size={14} />
                            下载
                          </button>
                           {cloudSave && (
                                <button
                                    onClick={() => handleDeleteCloudSave(slot.id)}
                                    className="px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                    title="删除云端存档"
                                >
                                    <Trash2 size={14} />
                                </button>
                           )}
                      </div>
                  )}

                  {/* 备份列表 */}
                  {showBackups === slot.id && (
                    <div className="mt-3 pt-3 border-t border-stone-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-stone-300">
                          备份列表
                        </span>
                        <button
                          onClick={() => handleCreateBackup(slot.id)}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
                          disabled={!currentPlayer || currentSlotId !== slot.id}
                        >
                          创建备份
                        </button>
                      </div>
                      {backups.length === 0 ? (
                        <div className="text-xs text-stone-500 py-2">
                          暂无备份
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {backups.map((backup, index) => (
                            <div
                              key={index}
                              className="bg-stone-900 rounded p-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-stone-400">
                                  {dayjs(backup.timestamp).format(
                                    'YYYY-MM-DD HH:mm:ss'
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    handleRestoreBackup(slot.id, index)
                                  }
                                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                  <RotateCcw size={12} />
                                  恢复
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 存档对比功能 */}
          {onCompareSaves && (
            <div className="mt-4 pt-4 border-t border-stone-700">
              <h3 className="text-md font-semibold text-stone-300 mb-3 flex items-center gap-2">
                <FileText size={18} />
                存档对比
              </h3>
              <div className="flex gap-2">
                <select
                  id="compare-slot1"
                  className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm"
                >
                  <option value="">选择存档1</option>
                  {slots
                    .filter((s) => s.data)
                    .map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        存档{slot.id} - {slot.playerName}
                      </option>
                    ))}
                </select>
                <select
                  id="compare-slot2"
                  className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm"
                >
                  <option value="">选择存档2</option>
                  {slots
                    .filter((s) => s.data)
                    .map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        存档{slot.id} - {slot.playerName}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    const slot1Select = document.getElementById(
                      'compare-slot1'
                    ) as HTMLSelectElement;
                    const slot2Select = document.getElementById(
                      'compare-slot2'
                    ) as HTMLSelectElement;
                    const slotId1 = parseInt(slot1Select.value, 10);
                    const slotId2 = parseInt(slot2Select.value, 10);

                    if (!slotId1 || !slotId2) {
                      showError('请选择两个存档进行对比！');
                      return;
                    }

                    if (slotId1 === slotId2) {
                      showError('请选择两个不同的存档！');
                      return;
                    }

                    handleCompareSaves(slotId1, slotId2);
                  }}
                  className="bg-mystic-gold hover:bg-yellow-600 text-stone-900 px-4 py-2 rounded font-semibold"
                >
                  对比
                </button>
              </div>
            </div>
          )}
    </Modal>
  );
};

export default SaveManagerModal;
