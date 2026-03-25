/**
 * 优化版本的 App 入口：与 App 等价，便于将来做 memo/懒加载等扩展。
 * App 内部自行订阅 Store，不接受外部 props。
 */

import React, { memo } from 'react';
import App from '../App';

const OptimizedApp = memo(() => {
  return <App />;
});

OptimizedApp.displayName = 'OptimizedApp';

export default OptimizedApp;
