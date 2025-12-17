import React, { useState, useEffect } from 'react';
import { X, Github, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface VersionChange {
  category: string;
  items: string[];
}

interface VersionInfo {
  version: string;
  date: string;
  changes: VersionChange[];
}

const ChangelogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const currentVersion = import.meta.env.VITE_APP_VERSION || '0.2.4';

  useEffect(() => {
    if (isOpen) {
      loadChangelog();
    }
  }, [isOpen]);

  const loadChangelog = async () => {
    setLoading(true);
    try {
      // 尝试从 public 目录加载
      const response = await fetch('/CHANGELOG.md');
      if (!response.ok) {
        throw new Error('Failed to fetch changelog');
      }
      const content = await response.text();
      const parsed = parseChangelog(content);
      setVersions(parsed);
    } catch (error) {
      console.error('Failed to load changelog:', error);
      // 如果加载失败，使用默认的版本信息
      setVersions([
        {
          version: currentVersion,
          date: new Date().toISOString().split('T')[0],
          changes: [
            {
              category: '版本更新',
              items: [`版本号更新至 ${currentVersion}`],
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseChangelog = (content: string): VersionInfo[] => {
    const versions: VersionInfo[] = [];
    const lines = content.split('\n');

    let currentVersion: VersionInfo | null = null;
    let currentCategory: VersionChange | null = null;
    let skipUntilNextVersion = false;

    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i];
      const line = originalLine.trim();

      // 匹配版本号行: ## [0.2.4] - 2025-12-17
      const versionMatch = line.match(/^## \[([^\]]+)\]\s*-\s*(.+)$/);
      if (versionMatch) {
        // 保存上一个版本
        if (currentVersion && currentCategory) {
          currentVersion.changes.push(currentCategory);
        }
        if (currentVersion) {
          versions.push(currentVersion);
        }

        // 开始新版本
        currentVersion = {
          version: versionMatch[1],
          date: versionMatch[2] || '',
          changes: [],
        };
        currentCategory = null;
        skipUntilNextVersion = false;
        continue;
      }

      // 如果已经跳过到计划中的功能部分，就不再解析
      if (
        line.includes('[计划中的功能]') ||
        line.includes('## 版本说明') ||
        line.includes('## 反馈与建议') ||
        line.includes('## 历史版本')
      ) {
        skipUntilNextVersion = true;
        continue;
      }

      if (skipUntilNextVersion || !currentVersion) {
        continue;
      }

      // 匹配分类标题: ### 🎉 新增功能
      const categoryMatch = line.match(/^###\s+(.+)$/);
      if (categoryMatch) {
        // 保存上一个分类
        if (currentCategory) {
          currentVersion.changes.push(currentCategory);
        }

        // 开始新分类
        currentCategory = {
          category: categoryMatch[1].trim(),
          items: [],
        };
        continue;
      }

      // 匹配列表项: - **战斗系统**: 添加神识属性
      // 检查是否是列表项（可能在原始行中有缩进）
      if (originalLine.match(/^\s*-\s+/)) {
        if (currentCategory) {
          // 移除开头的 "- " 和可能的前导空格
          const item = originalLine.replace(/^\s*-\s+/, '').trim();
          // 只添加非空项
          if (item) {
            currentCategory.items.push(item);
          }
        }
      }
    }

    // 保存最后一个版本和分类
    if (currentVersion) {
      if (currentCategory) {
        currentVersion.changes.push(currentCategory);
      }
      versions.push(currentVersion);
    }

    return versions;
  };

  const formatCategoryName = (category: string): string => {
    // 移除 emoji，只保留文字
    return category.replace(/^[🎉🐛🔧📚🎯🎨💥🔒]+\s*/, '').trim();
  };

  const getCategoryIcon = (category: string): string => {
    if (category.includes('新增')) return '🎉';
    if (category.includes('Bug') || category.includes('修复')) return '🐛';
    if (category.includes('优化') || category.includes('改进')) return '🔧';
    if (category.includes('代码')) return '📚';
    if (category.includes('稳定')) return '🎯';
    if (category.includes('界面')) return '🎨';
    return '📝';
  };

  if (!isOpen) return null;

  const latestVersion = versions[0];
  const isLatest = latestVersion?.version === currentVersion;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[90vh] md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="z-50 bg-stone-800 border-b border-stone-700 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            版本信息
            <span className="text-sm text-stone-400 font-mono">
              v{currentVersion}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-stone-400">加载中...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 当前版本状态 */}
              {isLatest && latestVersion && (
                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={20} className="text-green-400" />
                    <span className="text-green-400 font-semibold">
                      当前为最新版本
                    </span>
                  </div>
                  <div className="text-sm text-green-300">
                    已是最新版本 v{currentVersion}
                  </div>
                </div>
              )}

              {/* 前往仓库按钮 */}
              <a
                href="https://github.com/JeasonLoop/react-xiuxian-game"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded-lg px-4 py-3 transition-colors"
              >
                <Github size={18} />
                <span>前往仓库</span>
                <Check size={16} className="ml-auto" />
              </a>

              {/* 变更日志 */}
              <div>
                <h3 className="text-lg font-semibold text-stone-200 mb-4">
                  变更日志
                </h3>
                <div className="space-y-6">
                  {versions.map((version, idx) => (
                    <div
                      key={version.version}
                      className={`border rounded-lg overflow-hidden ${
                        idx === 0 && isLatest
                          ? 'border-green-700/50 bg-green-900/10'
                          : 'border-stone-700 bg-stone-900/30'
                      }`}
                    >
                      {/* 版本标题 */}
                      <div className="bg-stone-800/50 border-b border-stone-700 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-mystic-gold">
                              v{version.version}
                            </span>
                            {idx === 0 && isLatest && (
                              <span className="text-xs bg-green-700/50 text-green-300 px-2 py-1 rounded">
                                当前版本
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-stone-400">
                            {version.date}
                          </span>
                        </div>
                      </div>

                      {/* 版本内容 */}
                      <div className="p-4 space-y-4">
                        {version.changes.map((change, changeIdx) => (
                          <div key={changeIdx} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {getCategoryIcon(change.category)}
                              </span>
                              <h4 className="font-semibold text-stone-300">
                                {formatCategoryName(change.category)}
                              </h4>
                            </div>
                            <ul className="list-none space-y-1.5 ml-6">
                              {change.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  className="text-sm text-stone-400 flex items-start gap-2"
                                >
                                  <span className="text-stone-600 mt-1.5 flex-shrink-0">•</span>
                                  <span
                                    className="flex-1"
                                    dangerouslySetInnerHTML={{
                                      __html: item
                                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-stone-300">$1</strong>')
                                        .replace(/`(.+?)`/g, '<code class="bg-stone-800 px-1 rounded text-stone-300">$1</code>'),
                                    }}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;

