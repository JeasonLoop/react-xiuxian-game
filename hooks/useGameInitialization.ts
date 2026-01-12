import { useEffect } from 'react';
import { useIndexedDB } from './useIndexedDB';
import {
  initializeEventTemplateLibrary,
} from '../services/adventureTemplateService';
import {
  setBreakthroughDescriptionLibrary,
  isBreakthroughDescriptionLibraryInitialized,
  generateBreakthroughDescriptionLibrary,
  setEnemyNameLibrary,
  isEnemyNameLibraryInitialized,
  generateEnemyNameLibrary,
} from '../services/templateService';

export function useGameInitialization() {
  const {
    isReady,
    saveTemplates,
    loadTemplates,
    hasTemplates,
    saveBreakthroughDescriptions,
    loadBreakthroughDescriptions,
    hasBreakthroughDescriptions,
    saveEnemyNames,
    loadEnemyNames,
    hasEnemyNames,
  } = useIndexedDB();

  // 初始化事件模板库
  useEffect(() => {
    if (!isReady) return;

    const initTemplates = async () => {
      try {
        // 每次进入游戏都重新生成事件模板库
        console.log('正在生成初始事件模板库...');
        initializeEventTemplateLibrary(true);
      } catch (error) {
        console.error('初始化事件模板库失败:', error);
      }
    };

    initTemplates();
  }, [isReady]);

  // 初始化突破描述模板库
  useEffect(() => {
    if (!isReady) return;

    const initBreakthroughDescriptions = async () => {
      try {
        const hasStored = await hasBreakthroughDescriptions();

        if (hasStored) {
          const descriptions = await loadBreakthroughDescriptions();
          if (descriptions && descriptions.length > 0) {
            setBreakthroughDescriptionLibrary(descriptions);
            console.log('从 IndexedDB 加载突破描述模板库成功');
            return;
          }
        }

        if (!isBreakthroughDescriptionLibraryInitialized()) {
          console.log('生成新的突破描述模板库...');
          const newDescriptions = generateBreakthroughDescriptionLibrary();
          setBreakthroughDescriptionLibrary(newDescriptions);

          try {
            await saveBreakthroughDescriptions(newDescriptions);
            console.log('突破描述模板库已保存到 IndexedDB');
          } catch (error) {
            console.error('保存突破描述模板库到 IndexedDB 失败:', error);
          }
        }
      } catch (error) {
        console.error('初始化突破描述模板库失败:', error);
      }
    };

    initBreakthroughDescriptions();
  }, [isReady, saveBreakthroughDescriptions, loadBreakthroughDescriptions, hasBreakthroughDescriptions]);

  // 初始化敌人名称模板库
  useEffect(() => {
    if (!isReady) return;

    const initEnemyNames = async () => {
      try {
        const hasStored = await hasEnemyNames();

        if (hasStored) {
          const names = await loadEnemyNames();
          if (names && names.length > 0) {
            setEnemyNameLibrary(names);
            console.log('从 IndexedDB 加载敌人名称模板库成功');
            return;
          }
        }

        if (!isEnemyNameLibraryInitialized()) {
          console.log('生成新的敌人名称模板库...');
          const newNames = generateEnemyNameLibrary();
          setEnemyNameLibrary(newNames);

          try {
            await saveEnemyNames(newNames);
            console.log('敌人名称模板库已保存到 IndexedDB');
          } catch (error) {
            console.error('保存敌人名称模板库到 IndexedDB 失败:', error);
          }
        }
      } catch (error) {
        console.error('初始化敌人名称模板库失败:', error);
      }
    };

    initEnemyNames();
  }, [isReady, saveEnemyNames, loadEnemyNames, hasEnemyNames]);

  return { isReady };
}

