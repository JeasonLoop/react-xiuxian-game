#!/usr/bin/env node
/**
 * Docker构建脚本 - 自动读取package.json版本号并传递给Docker
 * 支持从 .env 文件和系统环境变量读取配置
 */

import { readFileSync, existsSync } from 'fs';
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

/**
 * 读取 .env 文件
 * 支持 .env, .env.local, .env.production 等文件
 */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const env = {};
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // 解析 KEY=VALUE 格式
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();

        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        env[key] = value;
      }
    }
  } catch (error) {
    console.warn(`⚠️  无法读取 ${filePath}:`, error.message);
  }

  return env;
}

// 按优先级读取环境变量文件（后面的会覆盖前面的）
const envFiles = [
  join(rootDir, '.env'),
  join(rootDir, '.env.local'),
  join(rootDir, '.env.production'),
  join(rootDir, '.env.production.local'),
];

let envVars = {};
for (const envFile of envFiles) {
  const fileEnv = loadEnvFile(envFile);
  envVars = { ...envVars, ...fileEnv };
  if (Object.keys(fileEnv).length > 0) {
    console.log(`📄 已读取环境变量文件: ${envFile}`);
  }
}

// 需要传递给 Docker 的环境变量列表
const dockerEnvVars = [
  'VITE_AI_KEY',
  'VITE_AI_PROVIDER',
  'VITE_AI_MODEL',
  'VITE_AI_API_URL',
  'VITE_AI_USE_PROXY',
  'VITE_APP_VERSION',
];

// 合并环境变量：系统环境变量 > .env 文件 > 默认值
const finalEnv = {};
for (const key of dockerEnvVars) {
  // 优先使用系统环境变量，然后是 .env 文件中的值
  finalEnv[key] = process.env[key] || envVars[key] || (key === 'VITE_APP_VERSION' ? version : undefined);

  // 显示已设置的环境变量（隐藏敏感信息）
  if (finalEnv[key]) {
    const displayValue = key === 'VITE_AI_KEY'
      ? `${finalEnv[key].substring(0, 8)}...`
      : finalEnv[key];
    console.log(`🔧 ${key}=${displayValue}`);
  }
}

// 检查必需的环境变量
if (!finalEnv.VITE_AI_KEY) {
  console.warn('⚠️  警告: VITE_AI_KEY 未设置，构建可能失败');
  console.warn('💡 提示: 请在 .env 文件中设置 VITE_AI_KEY，或在系统环境变量中设置');
}

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0] || 'build';

// 将环境变量设置到 process.env，以便传递给 Docker
for (const [key, value] of Object.entries(finalEnv)) {
  if (value !== undefined) {
    process.env[key] = value;
  }
}

// 构建 docker build 命令的 --build-arg 参数
function buildDockerArgs() {
  const buildArgs = [];
  for (const key of dockerEnvVars) {
    const value = finalEnv[key];
    if (value !== undefined) {
      buildArgs.push(`--build-arg ${key}="${value}"`);
    }
  }
  return buildArgs.join(' ');
}

const dockerArgs = buildDockerArgs();
const imageName = `crpi-pjhw4u9gqgvnjbm3.cn-shanghai.personal.cr.aliyuncs.com/loop-git-repo/react-xiuxian-game:${version}`;

const dockerCommands = {
  build: 'docker-compose build',
  'build-no-cache': 'docker-compose build --no-cache',
  'build-and-up': 'docker-compose up -d --build',
  // 直接使用 docker build 打包，带版本标签和构建参数
  'build-image': `docker build ${dockerArgs} -t ${imageName} .`,
  // 导出镜像（压缩与不压缩）
  pack: `docker save react-xiuxian-game:${version} | gzip > react-xiuxian-game-${version}.tar.gz`,
  'pack-uncompressed': `docker save -o react-xiuxian-game.tar react-xiuxian-game:${version}`,
  'push-image': `docker push ${imageName}`,
};

const dockerCommand = dockerCommands[command] || dockerCommands.build;

console.log(`\n🐳 执行命令: ${dockerCommand}`);
console.log(`📋 环境变量已准备完成\n`);

try {
  // 执行 Docker 命令，环境变量会自动传递给 docker-compose 或 docker build
  execSync(dockerCommand, {
    stdio: 'inherit',
    cwd: rootDir,
    env: process.env, // 传递所有环境变量（包括从 .env 文件读取的）
  });
  console.log(`\n✅ 构建完成！`);
} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}

