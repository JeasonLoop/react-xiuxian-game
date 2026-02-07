import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Save, Trash2, Download, Upload, Cloud, CloudUpload, CloudDownload, RefreshCw, AlertCircle } from 'lucide-react';
import {
  loadFromSlot,
  saveToSlot,
  deleteSlot,
  SaveData,
  exportSave,
  importSave,
  DEFAULT_SLOT_ID,
} from '../utils/saveManagerUtils';
import { showError, showSuccess, showConfirm } from '../utils/toastUtils';
import { PlayerStats, LogEntry } from '../types';
import dayjs from 'dayjs';
import { apiService, GameSave as CloudSave } from '../services/apiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: PlayerStats | null;
  currentLogs: LogEntry[];
  onLoadSave: (player: PlayerStats, logs: LogEntry[]) => void;
}

const SaveManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPlayer,
  currentLogs,
  onLoadSave,
}) => {
  const [localSave, setLocalSave] = useState<SaveData | null>(null);
  const [cloudSave, setCloudSave] = useState<CloudSave | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  const localFileInputRef = useRef<HTMLInputElement>(null);
  const cloudFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      refreshInfo();
    }
  }, [isOpen]);

  const refreshInfo = () => {
    // 刷新本地存档信息
    const local = loadFromSlot(DEFAULT_SLOT_ID);
    setLocalSave(local);

    // 刷新云端存档信息
    checkLoginAndFetchCloud();
  };

  const checkLoginAndFetchCloud = async () => {
    const loggedIn = apiService.isLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      setIsLoadingCloud(true);
      try {
        const save = await apiService.getCloudSave();
        setCloudSave(save);
      } catch (e) {
        console.error('Failed to fetch cloud save', e);
        // Don't show error toast on simple fetch failure to avoid spamming
      } finally {
        setIsLoadingCloud(false);
      }
    } else {
        setCloudSave(null);
    }
  };

  // =========================
  // 本地存档操作
  // =========================

  const handleSaveToLocal = () => {
    if (!currentPlayer) {
      showError('没有可保存的游戏数据！');
      return;
    }

    showConfirm(
      '确定要保存当前进度到本地吗？\n\n如果本地已有存档，将被覆盖。',
      '确认保存',
      () => {
        const success = saveToSlot(DEFAULT_SLOT_ID, currentPlayer, currentLogs);
        if (success) {
          showSuccess('已保存到本地！');
          refreshInfo();
        } else {
          showError('保存失败，请重试！');
        }
      }
    );
  };

  const handleLoadFromLocal = () => {
    if (!localSave) return;

    showConfirm(
      `确定要加载本地存档吗？\n\n玩家: ${localSave.player.name}\n境界: ${localSave.player.realm}\n保存时间: ${dayjs(localSave.timestamp).format('YYYY-MM-DD HH:mm:ss')}\n\n当前游戏进度将被替换，页面将自动刷新。`,
      '确认加载',
      () => {
        onLoadSave(localSave.player, localSave.logs);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    );
  };

  const handleDeleteLocal = () => {
    if (!localSave) return;

    showConfirm(
      `确定要删除本地存档吗？\n\n此操作无法撤销！`,
      '确认删除',
      () => {
        const success = deleteSlot(DEFAULT_SLOT_ID);
        if (success) {
          showSuccess('本地存档已删除！');
          setLocalSave(null);
        } else {
          showError('删除失败，请重试！');
        }
      }
    );
  };

  const handleExportLocal = () => {
    if (!localSave) return;

    try {
      const jsonString = exportSave(localSave);
      const fileName = `xiuxian-local-${localSave.player.name}-${dayjs(localSave.timestamp).format('YYYYMMDD-HHmmss')}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('本地存档导出成功！');
    } catch (error) {
      console.error('导出存档失败:', error);
      showError('导出存档失败！');
    }
  };

  const handleImportLocal = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const saveData = importSave(text);

      if (!saveData) {
        showError('存档文件格式错误！');
        return;
      }

      showConfirm(
        `确定要导入该存档到本地吗？\n\n玩家: ${saveData.player.name}\n境界: ${saveData.player.realm}\n\n本地现有存档将被覆盖。`,
        '确认导入',
        () => {
          const success = saveToSlot(DEFAULT_SLOT_ID, saveData.player, saveData.logs);
          if (success) {
            showSuccess('导入成功！');
            refreshInfo();
          } else {
            showError('导入失败，请重试！');
          }
        }
      );
    } catch (error) {
      console.error('导入存档失败:', error);
      showError('导入存档失败！');
    }

    if (localFileInputRef.current) localFileInputRef.current.value = '';
  };

  // =========================
  // 云端存档操作
  // =========================

  const handleUploadToCloud = async () => {
    if (!localSave) {
        showError('本地没有存档可上传！');
        return;
    }

    showConfirm(
        '确定要上传本地存档到云端吗？\n\n云端已有存档将被覆盖。',
        '确认上传',
        async () => {
            try {
                const saveDataStr = exportSave(localSave);
                const summary = `${localSave.player.name} - ${localSave.player.realm}`;
                await apiService.uploadSave(saveDataStr, summary);
                showSuccess('上传成功！');
                checkLoginAndFetchCloud();
            } catch (e: any) {
                showError('上传失败: ' + e.message);
            }
        }
    );
  };

  const handleDownloadFromCloud = async () => {
    if (!cloudSave) return;

    showConfirm(
        `确定要下载云端存档吗？\n\n描述: ${cloudSave.summary}\n更新时间: ${dayjs(cloudSave.updateTime).format('YYYY-MM-DD HH:mm')}\n\n本地存档将被覆盖！`,
        '确认下载',
        async () => {
            try {
                const saveData = importSave(cloudSave.saveData);
                if (!saveData) {
                    showError('云端存档格式错误！');
                    return;
                }
                const success = saveToSlot(DEFAULT_SLOT_ID, saveData.player, saveData.logs);
                if (success) {
                    showSuccess('下载成功！');
                    refreshInfo();
                } else {
                    showError('保存到本地失败！');
                }
            } catch (e: any) {
                showError('下载失败: ' + e.message);
            }
        }
    );
  };

  const handleDeleteCloud = async () => {
    if (!cloudSave) return;

    showConfirm(
        '确定要删除云端存档吗？\n此操作不可撤销！',
        '确认删除',
        async () => {
            try {
                await apiService.deleteCloudSave();
                showSuccess('云端存档删除成功！');
                setCloudSave(null);
            } catch (e: any) {
                showError('删除失败: ' + e.message);
            }
        }
    );
  };

  const handleExportCloud = async () => {
    if (!cloudSave) return;

    try {
        const blob = await apiService.exportSaveFile();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const summary = cloudSave.summary || 'cloud-save';
        a.download = `xiuxian-cloud-${summary.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}-${dayjs().format('YYYYMMDD')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess('云端存档导出成功！');
    } catch (e: any) {
        showError('导出失败: ' + e.message);
    }
  };

  const handleImportCloud = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showConfirm(
        '确定要将此文件直接导入到云端吗？\n\n云端现有存档将被覆盖。',
        '确认云导入',
        async () => {
             try {
                await apiService.importSaveFile(file);
                showSuccess('云端导入成功！');
                checkLoginAndFetchCloud();
            } catch (e: any) {
                showError('导入失败: ' + e.message);
            }
        }
    );

    if (cloudFileInputRef.current) cloudFileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="存档管理"
      size="3xl"
      height="auto"
      containerClassName="bg-stone-800 border-stone-700"
      headerClassName="bg-stone-800 border-b border-stone-700"
      titleClassName="text-mystic-gold font-serif"
      contentClassName="bg-stone-800 p-6"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 左侧：本地存档 */}
            <div className="bg-stone-900/50 border border-stone-700 rounded-lg p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-700/50">
                    <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                        <Save size={18} className="text-stone-400" />
                        本地存档
                    </h3>
                    {localSave && <span className="text-xs bg-stone-700 text-stone-300 px-2 py-0.5 rounded">已存在</span>}
                </div>

                <div className="flex-1">
                    {localSave ? (
                        <div className="space-y-2 text-sm text-stone-300">
                            <div className="flex justify-between"><span className="text-stone-500">玩家:</span> <span>{localSave.player.name}</span></div>
                            <div className="flex justify-between"><span className="text-stone-500">境界:</span> <span className="text-mystic-gold">{localSave.player.realm} {localSave.player.realmLevel}层</span></div>
                            <div className="flex justify-between"><span className="text-stone-500">时间:</span> <span>{dayjs(localSave.timestamp).format('YYYY-MM-DD HH:mm:ss')}</span></div>
                            <div className="mt-4 pt-4 border-t border-stone-700/30 flex gap-2">
                                <button onClick={handleLoadFromLocal} className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white py-2 rounded text-xs flex items-center justify-center gap-1">
                                    <RefreshCw size={14} /> 加载
                                </button>
                                <button onClick={handleDeleteLocal} className="bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-2 rounded text-xs">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-stone-500 text-sm">
                            <AlertCircle size={24} className="mb-2 opacity-50" />
                            暂无本地存档
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-700 flex flex-col gap-2">
                    <button
                        onClick={handleSaveToLocal}
                        disabled={!currentPlayer}
                        className={`w-full py-2 rounded text-sm flex items-center justify-center gap-2 ${currentPlayer ? 'bg-stone-700 hover:bg-stone-600 text-white' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
                    >
                        <Save size={14} />
                        保存当前进度到本地
                    </button>
                    <div className="flex gap-2">
                         <button
                            onClick={handleExportLocal}
                            disabled={!localSave}
                            className={`flex-1 py-2 rounded text-xs flex items-center justify-center gap-1 ${localSave ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' : 'bg-stone-900 text-stone-600'}`}
                        >
                            <Download size={14} /> 导出文件
                        </button>
                        <label className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 rounded text-xs flex items-center justify-center gap-1 cursor-pointer">
                            <Upload size={14} /> 导入文件
                            <input ref={localFileInputRef} type="file" accept=".json,.txt" onChange={handleImportLocal} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            {/* 右侧：云端存档 */}
            <div className="bg-stone-900/50 border border-stone-700 rounded-lg p-4 flex flex-col h-full relative overflow-hidden">
                {!isLoggedIn && (
                    <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
                        <Cloud size={32} className="text-stone-500 mb-2" />
                        <p className="text-stone-300 font-medium mb-1">未登录</p>
                        <p className="text-xs text-stone-500">登录后即可使用云端存档同步功能</p>
                    </div>
                )}

                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-700/50">
                    <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                        <Cloud size={18} className="text-blue-400" />
                        云端存档
                    </h3>
                    {cloudSave && <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">已同步</span>}
                </div>

                <div className="flex-1">
                    {isLoadingCloud ? (
                         <div className="h-32 flex items-center justify-center text-stone-500 text-xs animate-pulse">
                            加载中...
                        </div>
                    ) : cloudSave ? (
                        <div className="space-y-2 text-sm text-stone-300">
                             <div className="flex justify-between"><span className="text-stone-500">描述:</span> <span className="truncate max-w-[150px]">{cloudSave.summary}</span></div>
                             <div className="flex justify-between"><span className="text-stone-500">时间:</span> <span>{dayjs(cloudSave.updateTime).format('YYYY-MM-DD HH:mm')}</span></div>
                             <div className="mt-4 pt-4 border-t border-stone-700/30 flex gap-2">
                                <button onClick={handleDownloadFromCloud} className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white py-2 rounded text-xs flex items-center justify-center gap-1">
                                    <CloudDownload size={14} /> 下载覆盖本地
                                </button>
                                <button onClick={handleDeleteCloud} className="bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-2 rounded text-xs">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-stone-500 text-sm">
                             <Cloud size={24} className="mb-2 opacity-50" />
                             暂无云端存档
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-700 flex flex-col gap-2">
                     <button
                        onClick={handleUploadToCloud}
                        disabled={!localSave}
                        className={`w-full py-2 rounded text-sm flex items-center justify-center gap-2 ${localSave ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
                    >
                        <CloudUpload size={14} />
                        上传本地存档到云端
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCloud}
                            disabled={!cloudSave}
                            className={`flex-1 py-2 rounded text-xs flex items-center justify-center gap-1 ${cloudSave ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' : 'bg-stone-900 text-stone-600'}`}
                        >
                            <Download size={14} /> 云导出
                        </button>
                        <label className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 rounded text-xs flex items-center justify-center gap-1 cursor-pointer">
                            <Upload size={14} /> 云导入
                            <input ref={cloudFileInputRef} type="file" accept=".json,.txt" onChange={handleImportCloud} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
  );
};

export default SaveManagerModal;
