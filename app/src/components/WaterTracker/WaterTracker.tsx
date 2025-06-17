import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import React from 'react';
import blackSvg from '../../assets/svg/black.svg';
import filledSvg from '../../assets/svg/filled.svg';
import { Statistics } from '../Statistics/Statistics';
import { MobileMenu } from '../MobileMenu/MobileMenu';
import { Help } from '../Help/Help';
import { useWaterProgress } from '../../hooks/useWaterProgress';
import styles from './WaterTracker.module.scss';

interface WaterTrackerMethods {
  addWater: (quantity?: number) => void;
  removeWater: (quantity?: number) => void;
  setGoal: (glasses: number) => void;
  subscribeToChanges: (callback: (state: { current: number; goal: number }) => void) => void;
}

export const WaterTracker = forwardRef<WaterTrackerMethods>((_, ref) => {
  const {
    dailyGoal,
    currentGlasses,
    statistics,
    isLoading,
    updateProgress,
    updateGoal,
    updateHistoricalProgress
  } = useWaterProgress(15);

  const [glassesToAdd, setGlassesToAdd] = useState<string | number>(1);
  const [newGoal, setNewGoal] = useState<string | number>(dailyGoal);

  // Синхронизируем newGoal с dailyGoal при загрузке и изменении цели
  useEffect(() => {
    console.log('useEffect: dailyGoal изменился на:', dailyGoal);
    setNewGoal(dailyGoal);
  }, [dailyGoal]);

  // Рассчитываем процент заполнения, ограничивая его 100%
  const actualPercentage = (currentGlasses / dailyGoal) * 100;
  const fillPercentage = Math.min(actualPercentage, 100);

  useImperativeHandle(ref, () => ({
    addWater: (quantity?: number) => {
      console.log('WaterTracker: addWater вызван с количеством:', quantity);
      const glassesToUpdate = quantity ?? (typeof glassesToAdd === 'number' ? glassesToAdd : parseInt(glassesToAdd) || 1);
      console.log('WaterTracker: будет добавлено стаканов:', glassesToUpdate);

      if (!isNaN(glassesToUpdate) && glassesToUpdate > 0) {
        const newTotal = currentGlasses + glassesToUpdate;
        console.log('WaterTracker: обновляем прогресс до:', newTotal);
        updateProgress(newTotal);
      } else {
        console.log('WaterTracker: некорректное количество стаканов');
      }
    },
    removeWater: (quantity?: number) => {
      console.log('WaterTracker: removeWater вызван с количеством:', quantity);
      const glassesToUpdate = quantity ?? (typeof glassesToAdd === 'number' ? glassesToAdd : parseInt(glassesToAdd) || 1);
      console.log('WaterTracker: будет удалено стаканов:', glassesToUpdate);

      if (!isNaN(glassesToUpdate) && glassesToUpdate > 0) {
        const newTotal = Math.max(currentGlasses - glassesToUpdate, 0);
        console.log('WaterTracker: обновляем прогресс до:', newTotal);
        updateProgress(newTotal);
      } else {
        console.log('WaterTracker: некорректное количество стаканов');
      }
    },
    setGoal: (glasses: number) => {
      console.log('setGoal вызван с параметром:', glasses);
      const newGoalValue = Number(glasses);
      console.log('setGoal: преобразованное значение:', newGoalValue);
      if (!isNaN(newGoalValue) && newGoalValue > 0) {
        console.log('setGoal: вызываем updateGoal с:', newGoalValue);
        updateGoal(newGoalValue);
      }
    },
    subscribeToChanges: (callback) => {
      callback({ current: currentGlasses, goal: dailyGoal });
    }
  }), [currentGlasses, dailyGoal, glassesToAdd, updateProgress, updateGoal]);

  const handleGoalChange = () => {
    console.log('handleGoalChange: текущее значение newGoal:', newGoal);
    const goalValue = typeof newGoal === 'number' ? newGoal : parseInt(newGoal) || 1;
    if (goalValue > 0) {
      console.log('handleGoalChange: вызываем updateGoal с:', goalValue);
      updateGoal(goalValue);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidePanel}>
        <Statistics
          items={statistics}
          onUpdateProgress={updateHistoricalProgress}
        />
      </div>

      <div className={styles.mainContent}>
        <div
          className={styles.svgContainer}
          style={{ '--fill-percentage': `${100 - fillPercentage}%` } as React.CSSProperties}
        >
          <img src={blackSvg} alt="Empty state" />
          <img src={filledSvg} alt="Filled state" className={styles.filledSvg} />
        </div>

        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <input
              type="number"
              min="1"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => {
                // Разрешаем: цифры, навигационные клавиши, удаление и выделение
                if (
                  !/^\d$/.test(e.key) && // только цифры
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) && // служебные клавиши
                  !(e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) // комбинации для копирования/вставки
                ) {
                  e.preventDefault();
                }
              }}
              placeholder="Дневная цель"
              className={styles.input}
            />
            <button onClick={handleGoalChange} className={`${styles.button} ${styles.addButton}`}>
              Изменить цель
            </button>
          </div>

          <div className={styles.stats}>
            <p>Дневная цель: {dailyGoal} стаканов</p>
            <p>Выпито сегодня: {currentGlasses} стаканов</p>
            <p>Прогресс: {Math.round(actualPercentage)}%</p>
            {currentGlasses > dailyGoal && (
              <div className={styles.warning}>
                {currentGlasses > dailyGoal * 1.5 ? (
                  <p>Внимание! Вы значительно превысили дневную норму. Чрезмерное потребление воды может быть опасно для здоровья.</p>
                ) : (
                  <p>Вы превысили дневную цель. Возможно, стоит увеличить цель, если такое потребление для вас комфортно.</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <input
              type="number"
              min="1"
              value={glassesToAdd}
              onChange={(e) => setGlassesToAdd(e.target.value)}
              onKeyDown={(e) => {
                // Разрешаем: цифры, навигационные клавиши, удаление и выделение
                if (
                  !/^\d$/.test(e.key) && // только цифры
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) && // служебные клавиши
                  !(e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) // комбинации для копирования/вставки
                ) {
                  e.preventDefault();
                }
              }}
              className={styles.input}
            />
            <div className={styles.buttonGroup}>
              <button
                onClick={() => {
                  const value = typeof glassesToAdd === 'number' ? glassesToAdd : parseInt(glassesToAdd) || 1;
                  updateProgress(currentGlasses + value);
                }}
                className={`${styles.button} ${styles.addButton}`}
              >
                Добавить стаканы
              </button>
              <button
                onClick={() => {
                  const value = typeof glassesToAdd === 'number' ? glassesToAdd : parseInt(glassesToAdd) || 1;
                  updateProgress(Math.max(currentGlasses - value, 0));
                }}
                className={`${styles.button} ${styles.removeButton}`}
                disabled={currentGlasses === 0}
              >
                Убрать стаканы
              </button>
            </div>
          </div>
        </div>

        <MobileMenu
          statistics={statistics}
          onUpdateProgress={updateHistoricalProgress}
        />
      </div>

      <div className={styles.sidePanel}>
        <Help />
      </div>
    </div>
  );
});
