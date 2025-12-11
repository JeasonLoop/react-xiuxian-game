#!/usr/bin/env node
/**
 * Docker构建脚本 - 自动读取package.json版本号并传递给Docker
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取package.json获取版本号
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

console.log(`📦 检测到版本号: v${version}`);

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0] || 'build';

// 设置环境变量并执行docker/docker-compose命令
process.env.VITE_APP_VERSION = version;

const dockerCommands = {
  build: 'docker-compose build',
  'build-no-cache': 'docker-compose build --no-cache',
  'build-and-up': 'docker-compose up -d --build',
  // 直接使用 docker build 打包，带版本标签
  'build-image': `docker build -t crpi-pjhw4u9gqgvnjbm3.cn-shanghai.personal.cr.aliyuncs.com/loop-git-repo/react-xiuxian-game:${version} .`,
  // 导出镜像（压缩与不压缩）
  pack: `docker save react-xiuxian-game:${version} | gzip > react-xiuxian-game-${version}.tar.gz`,
  'pack-uncompressed': `docker save -o react-xiuxian-game.tar react-xiuxian-game:${version}`,
  'push-image': `docker push crpi-pjhw4u9gqgvnjbm3.cn-shanghai.personal.cr.aliyuncs.com/loop-git-repo/react-xiuxian-game:${version}`,
};

const dockerCommand = dockerCommands[command] || dockerCommands.build;

console.log(`🐳 执行命令: ${dockerCommand}`);
console.log(`🔧 环境变量 VITE_APP_VERSION=${version}`);

try {
  execSync(dockerCommand, {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      VITE_APP_VERSION: version,
    },
  });
  console.log(`✅ 完成！版本号已设置为 v${version}`);
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

