/**
 * 解析 CHANGELOG.md 的工具函数
 */

export interface VersionChange {
  category: string;
  items: string[];
}

export interface VersionInfo {
  version: string;
  date: string;
  changes: VersionChange[];
}

/**
 * 解析 CHANGELOG.md 内容
 */
export function parseChangelog(changelogContent: string): VersionInfo[] {
  const versions: VersionInfo[] = [];
  const lines = changelogContent.split('\n');

  let currentVersion: VersionInfo | null = null;
  let currentCategory: VersionChange | null = null;
  let skipUntilNextVersion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

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
    if (line.includes('[计划中的功能]') || line.includes('## 版本说明') || line.includes('## 反馈与建议') || line.includes('## 历史版本')) {
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
    if (line.startsWith('-')) {
      if (currentCategory) {
        // 移除开头的 "- "，并清理格式
        const item = line.replace(/^-\s+/, '').trim();
        currentCategory.items.push(item);
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
}

/**
 * 获取当前版本号
 */
export function getCurrentVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '0.2.4';
}

