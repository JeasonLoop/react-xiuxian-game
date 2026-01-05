import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from './common/Modal';
import { Zap, Shield, Sword, Heart, Eye, Gauge, Skull, CheckCircle2, XCircle, Sparkles, Grid3X3, HelpCircle, Lightbulb } from 'lucide-react';
import { TribulationState, TribulationResult } from '../types';
import {
  formatAttributeBonus,
  formatEquipmentBonus,
} from '../utils/tribulationUtils';
import { generateGoldenCorePuzzle, generateNascentSoulPuzzle, generateSpiritSeveringPuzzle, generateLongevityPuzzle } from '../utils/cultivationUtils';
import { TRIBULATION_STAGES,  HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS } from '../constants/index';

interface TribulationModalProps {
  tribulationState: TribulationState;
  onTribulationComplete: (result: TribulationResult) => void;
  player: any; // PlayerStats - 为了避免导入循环，使用any
}

const TribulationModal: React.FC<TribulationModalProps> = ({
  tribulationState,
  onTribulationComplete,
  player,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TribulationResult | null>(null);
  const hasStartedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 解密游戏状态
  const [puzzle, setPuzzle] = useState<any>(null);
  const [userInput, setUserInput] = useState<number[]>([]); // 用于数字序列
  const [currentSequence, setCurrentSequence] = useState<string[]>([]); // 用于符文序列
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 用于符文序列选择
  const [attempts, setAttempts] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);

  // 长生天劫五重考验状态
  const [longevityChallenges, setLongevityChallenges] = useState<any>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  // 2048游戏状态
  const [game2048Grid, setGame2048Grid] = useState<number[][]>([]);
  const [game2048Score, setGame2048Score] = useState<number>(0);
  const [gameOverTriggered, setGameOverTriggered] = useState(false);

  // 初始化2048游戏
  const init2048Game = useCallback(() => {
    setGameOverTriggered(false); // 重置游戏结束标志
    const grid: number[][] = Array(4).fill(null).map(() => Array(4).fill(0));
    // 随机添加两个初始方块（2或4）
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        emptyCells.push([i, j]);
      }
    }
    // 随机选择两个位置
    const pos1 = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    emptyCells.splice(emptyCells.indexOf(pos1), 1);
    const pos2 = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[pos1[0]][pos1[1]] = Math.random() < 0.9 ? 2 : 4;
    grid[pos2[0]][pos2[1]] = Math.random() < 0.9 ? 2 : 4;
    setGame2048Grid(grid);
    setGame2048Score(0);
  }, []);

  // 2048游戏：添加新的随机方块
  const addRandomTile = useCallback((grid: number[][]): number[][] => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
    return grid.map(row => [...row]);
  }, []);

  // 2048游戏：检查是否游戏结束（无法移动）
  const check2048GameOver = useCallback((grid: number[][]): boolean => {
    // 检查是否有空格
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) return false;
      }
    }

    // 检查是否有可合并的相邻方块
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = grid[i][j];
        // 检查右侧
        if (j < 3 && grid[i][j + 1] === current) return false;
        // 检查下方
        if (i < 3 && grid[i + 1][j] === current) return false;
      }
    }

    return true; // 游戏结束
  }, []);

  // 2048游戏：处理游戏结束
  const handle2048GameOver = useCallback(() => {
    // 防止重复触发
    if (gameOverTriggered) return;
    setGameOverTriggered(true);

    const puzzleData = puzzle?.data || puzzle;
    const targetScore = puzzleData?.targetScore || 2048;
    const isMet = game2048Score >= targetScore;

    if (!isMet) {
      // 未达到目标分数，判定失败
      const failMessage = tribulationState.tribulationLevel === '长生天劫' && longevityChallenges
        ? `第${currentChallengeIndex + 1}重考验失败！天地棋局失败，未能达成目标分数，长生之路断绝...`
        : '天地棋局失败！无法再移动且未达到目标分数，星辰之力反噬，你身陨道消...';

      const tribulationResult: TribulationResult = {
        success: false,
        deathProbability: 1.0,
        roll: Math.random(),
        description: failMessage,
      };
      setResult(tribulationResult);
      setIsProcessing(false);
      setShowPuzzle(false);
    }
  }, [puzzle, game2048Score, tribulationState.tribulationLevel, longevityChallenges, currentChallengeIndex]);

  // 2048游戏：移动逻辑
  const move2048 = useCallback((direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    setGame2048Grid(prevGrid => {
      const grid = prevGrid.map(row => [...row]);
      let moved = false;
      let newScore = 0;

      // 移动和合并逻辑
      const moveRow = (row: number[]): { row: number[], score: number } => {
        const filtered = row.filter(val => val !== 0);
        const merged: number[] = [];
        let score = 0;

        for (let i = 0; i < filtered.length; i++) {
          if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
            merged.push(filtered[i] * 2);
            score += filtered[i] * 2;
            i++; // 跳过下一个
          } else {
            merged.push(filtered[i]);
          }
        }

        while (merged.length < 4) {
          merged.push(0);
        }

        return { row: merged, score };
      };

      if (direction === 'left') {
        for (let i = 0; i < 4; i++) {
          const original = [...grid[i]];
          const result = moveRow(grid[i]);
          grid[i] = result.row;
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(grid[i])) {
            moved = true;
          }
        }
      } else if (direction === 'right') {
        for (let i = 0; i < 4; i++) {
          const original = [...grid[i]];
          const result = moveRow([...grid[i]].reverse());
          grid[i] = result.row.reverse();
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(grid[i])) {
            moved = true;
          }
        }
      } else if (direction === 'up') {
        for (let j = 0; j < 4; j++) {
          const col = grid.map(row => row[j]);
          const original = [...col];
          const result = moveRow(col);
          for (let i = 0; i < 4; i++) {
            grid[i][j] = result.row[i];
          }
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(result.row)) {
            moved = true;
          }
        }
      } else if (direction === 'down') {
        for (let j = 0; j < 4; j++) {
          const col = grid.map(row => row[j]).reverse();
          const original = [...col];
          const result = moveRow(col);
          const reversed = result.row.reverse();
          for (let i = 0; i < 4; i++) {
            grid[i][j] = reversed[i];
          }
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(result.row)) {
            moved = true;
          }
        }
      }

      if (moved) {
        setGame2048Score(prevScore => prevScore + newScore);
        const newGrid = addRandomTile(grid);
        // 检查是否游戏结束（无法移动）
        setTimeout(() => {
          if (check2048GameOver(newGrid)) {
            handle2048GameOver();
          }
        }, 300);
        return newGrid;
      }
      return prevGrid;
    });
    return true;
  }, [addRandomTile, check2048GameOver, handle2048GameOver]);

  // 初始化解密游戏（金丹期、元婴期、化神期）
  const initializePuzzle = useCallback(() => {
    if (tribulationState.tribulationLevel === '金丹天劫') {
      // 金丹期：数字序列找规律
      // 使用所有功法数量来决定游戏难度（随法门数上升）
      const artCount = player.cultivationArts?.length || 0;

      const puzzleData = generateGoldenCorePuzzle(artCount);
      setPuzzle(puzzleData);
      setUserInput([0]); // 数字序列只需要一个答案
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === '元婴天劫') {
      // 元婴期：2048游戏（使用天地精华品质和整体实力决定难度）
      const essenceQuality = player.heavenEarthEssence
        ? (HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence]?.quality || 50)
        : 50;

      // 计算玩家整体实力（结合功法和精华品质）
      const artCount = player.cultivationArts?.length || 0;
      // 综合实力计算：精华品质占70%，功法数量占30%
      const combinedStrength = essenceQuality * 0.7 + artCount * 10 * 0.3;

      // 使用2048游戏，难度基于综合实力
      const puzzleData = generateNascentSoulPuzzle(combinedStrength);
      setPuzzle(puzzleData);
      setUserInput([]);
      init2048Game(); // 初始化2048游戏
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === '化神天劫') {
      // 化神期：符文序列（使用天地之髓品质决定难度）
      const marrowQuality = player.heavenEarthMarrow
        ? (HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow]?.quality || 50)
        : 50;

      const puzzleData = generateSpiritSeveringPuzzle(marrowQuality);
      setPuzzle(puzzleData);
      setCurrentSequence([...puzzleData.sequence]); // 初始化当前序列
      setSelectedIndex(null); // 重置选择
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === '长生天劫') {
      // 长生天劫：五重考验
      const ruleCount = player.longevityRules?.length || 0;
      const puzzleData = generateLongevityPuzzle(ruleCount);
      setLongevityChallenges(puzzleData);
      setCurrentChallengeIndex(0);
      const firstChallenge = puzzleData.challenges[0];
      // 设置第一个考验，根据类型初始化状态
      setPuzzle({ type: firstChallenge.type, data: firstChallenge.data });
      setUserInput([]);
      // 如果是符文序列，从data中初始化序列
      if (firstChallenge.type === '符文序列' && firstChallenge.data?.sequence) {
        setCurrentSequence([...firstChallenge.data.sequence]);
      } else {
        setCurrentSequence([]);
      }
      // 如果是2048游戏或天地棋局，初始化游戏
      if (firstChallenge.type === '天地棋局') {
        init2048Game();
      }
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    }
  }, [tribulationState, player.cultivationArts, player.heavenEarthEssence, player.heavenEarthMarrow, player.longevityRules, init2048Game]);

  const continueTribulation = useCallback(() => {
    let stageIndex = 0;

    const playStage = () => {
      if (stageIndex < TRIBULATION_STAGES.length - 2) { // -2 排除成功和失败状态
        setCurrentStage(stageIndex);
        stageIndex++;
        const delay = TRIBULATION_STAGES[stageIndex - 1].delay;
        timeoutRef.current = setTimeout(playStage, delay);
      } else {
        // 所有阶段完成，计算结果
        const tribulationResult: TribulationResult = {
          success: Math.random() > tribulationState.deathProbability,
          deathProbability: tribulationState.deathProbability,
          roll: Math.random(),
          hpLoss: Math.floor(tribulationState.totalStats.maxHp * (Math.random() * 0.3 + 0.1)),
          description: '',
        };

        if (tribulationResult.success) {
          // 渡劫成功
          const hpLossPercent = Math.random() * 0.3 + 0.1; // 损失10%-40%气血
          tribulationResult.hpLoss = Math.floor(tribulationState.totalStats.maxHp * hpLossPercent);

          if (tribulationResult.deathProbability < 0.2) {
            tribulationResult.description = '天劫对你来说如同儿戏，你轻松度过三道雷劫，毫发无损！';
          } else if (tribulationResult.deathProbability < 0.4) {
            tribulationResult.description = '你咬牙坚持，虽然身负重伤，但成功度过天劫！';
          } else if (tribulationResult.deathProbability < 0.6) {
            tribulationResult.description = '天劫凶险，你险象环生，最终险渡难关！';
          } else {
            tribulationResult.description = '你在生死边缘徘徊，凭着绝世运气躲过致命雷击！';
          }
        } else {
          // 渡劫失败
          if (tribulationResult.deathProbability < 0.3) {
            tribulationResult.description = '天劫太强，你虽全力抵抗，仍被雷霆击中，魂飞魄散...';
          } else if (tribulationResult.deathProbability < 0.5) {
            tribulationResult.description = '雷劫太过凶猛，你肉身被毁，元神亦被打散...';
          } else if (tribulationResult.deathProbability < 0.7) {
            tribulationResult.description = '天地之威不可挡，你在天劫下化为尘埃...';
          } else {
            tribulationResult.description = '绝世凶劫降临，你毫无还手之力，当场陨落...';
          }
        }

        setIsProcessing(false);
        setResult(tribulationResult);
      }
    };

    playStage();
  }, [tribulationState]);

  const handlePuzzleSubmit = useCallback(() => {
    if (!puzzle) return;

    setAttempts(prev => prev + 1);

    let isCorrect = false;

    // 根据游戏类型判断答案
    if (puzzle.puzzleType === '数字序列') {
      // 数字序列游戏：只需要比较一个答案
      isCorrect = userInput[0] === puzzle.solution;
    } else if (puzzle.puzzleType === '符文序列') {
      // 符文序列游戏：比较当前序列是否等于目标序列
      isCorrect = currentSequence.length === puzzle.targetSequence.length &&
                  currentSequence.every((val, idx) => val === puzzle.targetSequence[idx]);
    } else if (puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局' || puzzle.type === '2048' || puzzle.type === '天地棋局') {
      // 2048游戏/天地棋局：检查分数是否达到目标
      const puzzleData = puzzle.data || puzzle;
      const targetScore = puzzleData.targetScore || 2048;
      isCorrect = game2048Score >= targetScore;
    } else if (tribulationState.tribulationLevel === '长生天劫' && longevityChallenges) {
      // 长生天劫：检查当前考验的答案
      const challenge = longevityChallenges.challenges[currentChallengeIndex];
      if (challenge.type === '八卦阵') {
        // 八卦阵使用数字序列逻辑
        isCorrect = userInput[0] === challenge.data.solution;
      } else if (challenge.type === '2048' || challenge.type === '天地棋局') {
        // 2048游戏/天地棋局（在长生天劫中）
        const targetScore = challenge.data.targetScore || 2048;
        isCorrect = game2048Score >= targetScore;
      } else if (challenge.type === '符文序列') {
        // 符文序列
        isCorrect = currentSequence.length === challenge.data.targetSequence.length &&
                    currentSequence.every((val, idx) => val === challenge.data.targetSequence[idx]);
      } else if (challenge.type === '心魔考验' || challenge.type === '天道问答') {
        // 心魔考验和天道问答：总是正确（简化处理，实际可以添加问答逻辑）
        isCorrect = true;
      }
    }

    if (isCorrect) {
      // 如果是长生天劫，检查是否还有下一个考验
      if (tribulationState.tribulationLevel === '长生天劫' && longevityChallenges) {
        if (currentChallengeIndex < longevityChallenges.challenges.length - 1) {
          // 进入下一个考验
          const nextIndex = currentChallengeIndex + 1;
          setCurrentChallengeIndex(nextIndex);
          const nextChallenge = longevityChallenges.challenges[nextIndex];
          setPuzzle({ type: nextChallenge.type, data: nextChallenge.data });
          setUserInput([]);
          // 如果是符文序列，从data中初始化序列
          if (nextChallenge.type === '符文序列' && nextChallenge.data?.sequence) {
            setCurrentSequence([...nextChallenge.data.sequence]);
          } else {
            setCurrentSequence([]);
          }
          // 如果是2048游戏或天地棋局，初始化游戏
          if (nextChallenge.type === '2048' || nextChallenge.type === '天地棋局') {
            init2048Game();
          }
          setAttempts(0);
          setShowHint(false);
          setHintUsed(false);
        } else {
          // 所有考验完成，继续天劫
          setShowPuzzle(false);
          continueTribulation();
        }
      } else {
        // 其他天劫：解密成功，继续天劫
        setShowPuzzle(false);
        continueTribulation();
      }
    } else if (attempts >= (puzzle.maxAttempts || puzzle.maxMoves || puzzle.maxSteps || 3) - 1) {
      // 解密失败，天劫失败
      let failMessage = '解密失败！天劫之力将你吞噬...';
      if (puzzle.puzzleType === '数字序列') {
        failMessage = '数字序列推演失败！雷劫趁虚而入，你身陨道消...';
      } else if (puzzle.puzzleType === '符文序列') {
        failMessage = '符文序列推演失败！天劫之力将你吞噬...';
      } else if (puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局') {
        failMessage = '天地棋局挑战失败！未能达到目标分数，星辰之力反噬，你身陨道消...';
      } else if (tribulationState.tribulationLevel === '长生天劫') {
        failMessage = `第${currentChallengeIndex + 1}重考验失败！长生之路断绝，你身陨道消...`;
      }
      const tribulationResult: TribulationResult = {
        success: false,
        deathProbability: 1.0,
        roll: Math.random(),
        description: failMessage,
      };
      setResult(tribulationResult);
      setIsProcessing(false);
      setShowPuzzle(false);
    }
  }, [puzzle, userInput, currentSequence, game2048Score, attempts, continueTribulation, tribulationState, longevityChallenges, currentChallengeIndex]);

  const startTribulation = useCallback(() => {
    if (!tribulationState.isOpen || isProcessing) return;

    // 金丹期、元婴期、化神期、长生天劫特殊处理：先进行解密游戏
    if (tribulationState.tribulationLevel === '金丹天劫' ||
        tribulationState.tribulationLevel === '元婴天劫' ||
        tribulationState.tribulationLevel === '化神天劫' ||
        tribulationState.tribulationLevel === '长生天劫') {
      initializePuzzle();
      return;
    }

    // 其他境界正常流程
    continueTribulation();
  }, [tribulationState, isProcessing, initializePuzzle, continueTribulation]);

  useEffect(() => {
    // 当弹窗打开时，自动开始渡劫动画
    // 只有当没有在处理且没有结果且之前没开始过时才触发
    if (tribulationState.isOpen && !isProcessing && !result && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setIsProcessing(true);
      startTribulation();
    }
    // 当弹窗关闭时，重置状态
    if (!tribulationState.isOpen) {
      hasStartedRef.current = false;
      setCurrentStage(0);
      setIsProcessing(false);
      setResult(null);
      setShowPuzzle(false);
      setPuzzle(null);
      setUserInput([]);
      setCurrentSequence([]);
      setGame2048Grid([]);
      setGame2048Score(0);
      setGameOverTriggered(false);
      setLongevityChallenges(null);
      setCurrentChallengeIndex(0);
      setAttempts(0);
      // 清除可能存在的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [tribulationState.isOpen, isProcessing, result, startTribulation]);

  // 处理2048游戏的键盘事件和触摸滑动
  useEffect(() => {
    if (!showPuzzle || !puzzle) return;
    const is2048 = puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局' || puzzle.type === '2048' || puzzle.type === '天地棋局';
    if (!is2048) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        move2048('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        move2048('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        move2048('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        move2048('right');
      }
    };

    // 触摸滑动处理
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30; // 最小滑动距离

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // 只有滑动距离超过最小值才触发
      if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;

      // 判断滑动方向
      if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (deltaX > 0) {
          move2048('right');
        } else {
          move2048('left');
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          move2048('down');
        } else {
          move2048('up');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showPuzzle, puzzle, move2048]);

  const handleClose = () => {
    if (result) {
      onTribulationComplete(result);
    }
  };

  if (!tribulationState.isOpen) return null;

  const riskColor = tribulationState.deathProbability < 0.3 ? 'text-green-400' :
                   tribulationState.deathProbability < 0.5 ? 'text-yellow-400' :
                   tribulationState.deathProbability < 0.7 ? 'text-orange-400' : 'text-red-400';

  const currentStageInfo = TRIBULATION_STAGES[currentStage];

  return (
    <Modal
      isOpen={tribulationState.isOpen}
      onClose={handleClose}
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size="3xl"
      height="auto"
      containerClassName="bg-linear-to-b from-slate-900 to-stone-900 border-2 border-purple-500/50"
      contentClassName="p-4 sm:p-6 md:p-8"
      zIndex={200}
    >
          {/* 标题 */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <Sparkles className="text-purple-400 w-6 h-6 sm:w-8 sm:h-8" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-purple-300">
                {tribulationState.tribulationLevel}
              </h2>
              <Sparkles className="text-purple-400 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <p className="text-sm sm:text-base md:text-lg text-stone-300">
              {tribulationState.targetRealm}突破在即，天劫降临！
            </p>
          </div>

          {/* 渡劫动画阶段 */}
          <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-6 bg-black/30 rounded-lg border border-purple-500/30">
            {/* 解密游戏 */}
            {showPuzzle && puzzle && (
              <div className="text-center">
                <Grid3X3 className="text-purple-400 mx-auto mb-4 sm:mb-6 w-8 h-8 sm:w-10 sm:h-10" />
                <h3 className="text-lg sm:text-xl md:text-2xl text-purple-300 font-serif mb-2 sm:mb-3">
                  {tribulationState.tribulationLevel === '长生天劫' && longevityChallenges ? (
                    <>第{currentChallengeIndex + 1}重考验：{puzzle.type}</>
                  ) : (
                    puzzle.puzzleType === '数字序列' ? '数字序列推演' :
                    puzzle.puzzleType === '符文序列' ? '符文序列推演' :
                    puzzle.puzzleType === '2048' ? '2048游戏' :
                    puzzle.puzzleType === '天地棋局' ? '天地棋局' :
                    '解密游戏'
                  )}
                </h3>
                {tribulationState.tribulationLevel === '长生天劫' && longevityChallenges && (
                  <p className="text-sm text-yellow-400 mb-2">
                    进度：{currentChallengeIndex + 1}/{longevityChallenges.challenges.length}
                  </p>
                )}
                <p className="text-xs sm:text-sm md:text-base text-stone-400 mb-4 sm:mb-6">
                  {tribulationState.tribulationLevel === '长生天劫' && puzzle.data?.description ? puzzle.data.description : puzzle.description}
                </p>

                {/* 数字序列游戏 */}
                {(puzzle.puzzleType === '数字序列' || (tribulationState.tribulationLevel === '长生天劫' && puzzle.type === '八卦阵')) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 flex-wrap">
                      {(tribulationState.tribulationLevel === '长生天劫' && puzzle.type === '八卦阵' ? puzzle.data?.sequence : puzzle.sequence)?.map((num: number, index: number) => (
                        <div
                          key={index}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-900/50 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-purple-200"
                        >
                          {num}
                        </div>
                      ))}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-stone-800 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-stone-400">
                        ?
                      </div>
                    </div>

                    {/* 答案输入 */}
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">请输入下一个数字：</label>
                      <input
                        type="number"
                        value={userInput[0] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setUserInput([val]);
                        }}
                        className="w-24 h-12 sm:w-28 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-stone-800 border-2 border-purple-500 rounded-lg text-stone-200 focus:border-purple-400 focus:outline-none"
                        placeholder="?"
                        min="1"
                      />
                    </div>
                  </div>
                )}

                {/* 2048游戏 */}
                {(puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局' || puzzle.type === '2048' || puzzle.type === '天地棋局') && (() => {
                  const puzzleData = puzzle.data || puzzle;
                  const targetScore = puzzleData.targetScore || 2048;

                  // 获取数字颜色
                  const getTileColor = (num: number): string => {
                    if (num === 0) return 'bg-stone-800 text-stone-600';
                    const colors: { [key: number]: string } = {
                      2: 'bg-stone-700 text-stone-200',
                      4: 'bg-stone-600 text-stone-100',
                      8: 'bg-yellow-900/70 text-yellow-100',
                      16: 'bg-yellow-800/70 text-yellow-50',
                      32: 'bg-orange-900/70 text-orange-100',
                      64: 'bg-orange-800/70 text-orange-50',
                      128: 'bg-red-900/70 text-red-100',
                      256: 'bg-red-800/70 text-red-50',
                      512: 'bg-purple-900/70 text-purple-100',
                      1024: 'bg-purple-800/70 text-purple-50',
                      2048: 'bg-green-900/70 text-green-50',
                    };
                    return colors[num] || 'bg-blue-900/70 text-blue-50';
                  };

                  return (
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-sm text-stone-400">当前分数: <span className="text-purple-300 font-bold">{game2048Score}</span></p>
                            <p className="text-sm text-stone-400">目标分数: <span className="text-yellow-300 font-bold">{targetScore}</span></p>
                          </div>
                          {game2048Score >= targetScore && (
                            <span className="text-green-400 font-bold text-sm">✓ 已达到目标！</span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4 max-w-xs mx-auto">
                          {game2048Grid.map((row, i) =>
                            row.map((cell, j) => (
                              <div
                                key={`${i}-${j}`}
                                className={`w-16 h-16 sm:w-20 sm:h-20 border-2 border-purple-500/30 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold ${getTileColor(cell)}`}
                              >
                                {cell !== 0 ? cell : ''}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-2 mb-4">
                          <button
                            onClick={() => move2048('up')}
                            className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                          >
                            ↑
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => move2048('left')}
                              className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => move2048('right')}
                              className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                            >
                              →
                            </button>
                          </div>
                          <button
                            onClick={() => move2048('down')}
                            className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                          >
                            ↓
                          </button>
                        </div>
                        <p className="text-xs text-stone-500">使用方向键或点击按钮移动方块</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 符文序列游戏 */}
                {(puzzle.puzzleType === '符文序列' || (tribulationState.tribulationLevel === '长生天劫' && puzzle.type === '符文序列')) && (
                  <div className="mb-6">
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">目标序列：</label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                        {(tribulationState.tribulationLevel === '长生天劫' && puzzle.type === '符文序列' ? puzzle.data?.targetSequence : puzzle.targetSequence)?.map((symbol: string, index: number) => (
                          <div
                            key={index}
                            className="w-12 h-12 sm:w-14 sm:h-14 bg-green-900/50 border-2 border-green-500 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-green-200"
                          >
                            {symbol}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">当前序列（点击两个符文交换位置）：</label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                        {currentSequence.map((symbol: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (selectedIndex === null) {
                                // 第一次点击：选择第一个符文
                                setSelectedIndex(index);
                              } else if (selectedIndex === index) {
                                // 点击同一个符文：取消选择
                                setSelectedIndex(null);
                              } else {
                                // 第二次点击：交换两个符文
                                const newSequence = [...currentSequence];
                                [newSequence[selectedIndex], newSequence[index]] = [newSequence[index], newSequence[selectedIndex]];
                                setCurrentSequence(newSequence);
                                setSelectedIndex(null);
                              }
                            }}
                            className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold transition-colors cursor-pointer ${
                              selectedIndex === index
                                ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                                : 'bg-purple-900/50 border-purple-500 text-purple-200 hover:bg-purple-800/50'
                            }`}
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mt-2">
                        {selectedIndex === null
                          ? '提示：先点击一个符文，再点击另一个符文来交换位置'
                          : `已选择第 ${selectedIndex + 1} 个符文，请点击另一个符文交换`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 提示按钮和规则说明 */}
                {puzzle.puzzleType !== '2048' && puzzle.puzzleType !== '天地棋局' && (puzzle.type !== '2048' && puzzle.type !== '天地棋局' && puzzle.type !== '心魔考验' && puzzle.type !== '天道问答') && (
                  <div className="mb-4 space-y-2">
                    <button
                      onClick={() => {
                        if (!hintUsed) {
                          setHintUsed(true);
                        }
                        setShowHint(!showHint);
                      }}
                      className="px-3 py-1.5 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                    >
                      <HelpCircle size={14} />
                      {showHint ? '隐藏提示' : '查看提示'}
                    </button>

                    {showHint && puzzle.pattern && (
                      <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 text-left max-w-md mx-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="text-yellow-400" size={16} />
                          <span className="text-sm font-bold text-yellow-300">规律提示</span>
                        </div>
                        <div className="text-xs text-stone-300 space-y-1.5">
                          <div><strong className="text-purple-300">规律类型：</strong>{puzzle.pattern || puzzle.data?.pattern}</div>
                          <div className="mt-2 pt-2 border-t border-purple-500/30">
                            <strong className="text-yellow-300">常见规律：</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-400">
                              <li>等差数列：每次增加相同的数（如：2, 4, 6, 8...）</li>
                              <li>等比数列：每次乘以相同的数（如：2, 4, 8, 16...）</li>
                              <li>递增步长：每次增加的数逐渐变大（如：1, 3, 6, 10...）</li>
                              <li>平方序列：完全平方数（如：1, 4, 9, 16...）</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 心魔考验和天道问答的特殊显示 */}
                {(puzzle.type === '心魔考验' || puzzle.type === '天道问答') && (
                  <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-stone-300 mb-4">{puzzle.data?.description}</p>
                    {puzzle.data?.questions?.map((q: string, idx: number) => (
                      <div key={idx} className="mb-3 text-sm text-stone-400">
                        {idx + 1}. {q}
                      </div>
                    ))}
                    <p className="text-xs text-yellow-400 mt-4">这是对道心的考验，保持坚定即可通过。</p>
                  </div>
                )}

                <div className="text-xs sm:text-sm text-stone-500 mb-4 sm:mb-6">
                  {puzzle.maxAttempts && (
                    <>剩余尝试次数: {puzzle.maxAttempts - attempts}</>
                  )}
                  {(puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局' || puzzle.type === '2048' || puzzle.type === '天地棋局') && (() => {
                    const puzzleData = puzzle.data || puzzle;
                    const targetScore = puzzleData.targetScore || 2048;
                    return (
                      <div>
                        目标分数: {targetScore} | 当前分数: {game2048Score}
                        {game2048Score >= targetScore && <span className="text-green-400 ml-2">✓ 已达到目标</span>}
                      </div>
                    );
                  })()}
                  {puzzle.maxSteps && (
                    <>剩余步数: {puzzle.maxSteps - attempts}</>
                  )}
                  {hintUsed && <span className="text-yellow-400 ml-2">(已查看提示)</span>}
                </div>

                <button
                  onClick={handlePuzzleSubmit}
                  disabled={
                    (puzzle.puzzleType === '数字序列' || puzzle.type === '八卦阵')
                      ? (!userInput[0] || userInput[0] === 0)
                      : (puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局' || puzzle.type === '2048' || puzzle.type === '天地棋局')
                      ? (() => {
                          const puzzleData = puzzle.data || puzzle;
                          const targetScore = puzzleData.targetScore || 2048;
                          return game2048Score < targetScore;
                        })()
                      : false
                  }
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold rounded-lg transition-colors"
                >
                  {(puzzle.puzzleType === '数字序列' || puzzle.type === '八卦阵') ? '提交答案' :
                   (puzzle.puzzleType === '符文序列' || puzzle.type === '符文序列') ? '确认序列' :
                   (puzzle.puzzleType === '2048' || puzzle.puzzleType === '天地棋局' || puzzle.type === '2048' || puzzle.type === '天地棋局') ? '确认完成' :
                   (puzzle.type === '心魔考验' || puzzle.type === '天道问答') ? '坚定道心' :
                   '确认'}
                </button>
              </div>
            )}

            {isProcessing && !showPuzzle && (
              <div className="text-center">
                <Zap className="text-yellow-400 mx-auto mb-2 sm:mb-3 animate-pulse w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-yellow-300 font-medium mb-1 sm:mb-2">
                  {currentStageInfo.stage}
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-400">{currentStageInfo.description}</p>
              </div>
            )}

            {result && result.success && (
              <div className="text-center">
                <CheckCircle2 className="text-green-400 mx-auto mb-2 sm:mb-3 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-green-300 font-medium mb-1 sm:mb-2">
                  渡劫成功
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-300 mb-2 sm:mb-3">{result.description}</p>
                <p className="text-xs sm:text-sm text-orange-300">
                  损耗气血：{result.hpLoss} / {tribulationState.totalStats.maxHp}
                </p>
              </div>
            )}

            {result && !result.success && (
              <div className="text-center">
                <XCircle className="text-red-400 mx-auto mb-2 sm:mb-3 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-red-300 font-medium mb-1 sm:mb-2">
                  渡劫失败
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-300">{result.description}</p>
              </div>
            )}
          </div>

          {/* 天劫详情 */}
          {!result && (
            <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3 md:space-y-4">
              {/* 死亡概率 */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Skull className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">死亡概率</span>
                </div>
                <span className={`text-lg sm:text-xl md:text-2xl font-bold ${riskColor}`}>
                  {(tribulationState.deathProbability * 100).toFixed(1)}%
                </span>
              </div>

              {/* 属性修正 */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Shield className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">属性加成</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">
                  {formatAttributeBonus(tribulationState.attributeBonus)}
                </span>
              </div>

              {/* 装备修正 */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Sparkles className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">装备加成</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">
                  {formatEquipmentBonus(tribulationState.equipmentBonus)}
                </span>
              </div>

              {/* 综合属性 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Sword className="text-orange-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">攻击</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.attack}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Shield className="text-blue-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">防御</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.defense}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Heart className="text-red-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">气血</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.maxHp}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Eye className="text-purple-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">神识</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.spirit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Gauge className="text-green-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">体魄</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.physique}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Zap className="text-yellow-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">速度</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.speed}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 按钮 */}
          {result && (
            <button
              onClick={handleClose}
              className={`w-full py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold rounded-lg border-2 transition-all ${
                result.success
                  ? 'bg-green-700 hover:bg-green-600 text-green-100 border-green-500'
                  : 'bg-red-700 hover:bg-red-600 text-red-100 border-red-500'
              }`}
            >
              {result.success ? '成功突破' : '魂飞魄散'}
            </button>
          )}

          {!result && (
            <div className="text-center text-stone-500 text-xs sm:text-sm mt-2 sm:mt-4">
              天劫降临，不可逃避，唯有直面生死！
            </div>
          )}
    </Modal>
  );
};

export default TribulationModal;
