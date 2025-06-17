import { useState, useEffect, useCallback } from 'react';
import { DailyProgress } from '../types/statistics';
import { getMotivationMessage } from '../types/statistics';
import * as db from '../services/db';

export const useWaterProgress = (initialGoal: number = 15) => {
  const [dailyGoal, setDailyGoal] = useState(initialGoal);
  const [currentGlasses, setCurrentGlasses] = useState(0);
  const [statistics, setStatistics] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Функция для проверки, является ли дата другим днем
  const isNewDay = useCallback((date1: Date, date2: Date) => {
    return date1.getFullYear() !== date2.getFullYear() ||
           date1.getMonth() !== date2.getMonth() ||
           date1.getDate() !== date2.getDate();
  }, []);

  // Функция для сохранения прогресса в статистику
  const saveProgressToStatistics = useCallback(async (progress: { goal: number; glassesDrunk: number; lastUpdate: string }) => {
    const percentage = (progress.glassesDrunk / progress.goal) * 100;
    const statsEntry: DailyProgress = {
      date: progress.lastUpdate,
      goal: progress.goal,
      glassesDrunk: progress.glassesDrunk,
      percentage,
      motivation: getMotivationMessage(percentage)
    };

    await db.saveStatistics(statsEntry);

    setStatistics(prevStats => {
      const existingIndex = prevStats.findIndex(
        stat => !isNewDay(new Date(stat.date), new Date(progress.lastUpdate))
      );

      if (existingIndex !== -1) {
        const updatedStats = [...prevStats];
        updatedStats[existingIndex] = statsEntry;
        return updatedStats;
      } else {
        return [...prevStats, statsEntry];
      }
    });
  }, [isNewDay]);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем статистику
        const stats = await db.getAllStatistics();
        setStatistics(stats);

        // Загружаем текущий прогресс
        const progress = await db.getCurrentProgress();
        const now = new Date();

        if (progress) {
          const lastUpdate = new Date(progress.lastUpdate);

          // Проверяем, не наступил ли новый день
          if (isNewDay(now, lastUpdate)) {
            // Сохраняем статистику за предыдущий день
            await saveProgressToStatistics(progress);

            // Сбрасываем текущий прогресс на новый день
            await db.saveCurrentProgress(progress.goal, 0, now.toISOString());
            setDailyGoal(progress.goal);
            setCurrentGlasses(0);
          } else {
            // Если тот же день, используем сохраненные значения
            setDailyGoal(progress.goal);
            setCurrentGlasses(progress.glassesDrunk);
          }
        } else {
          // Если нет сохраненного прогресса, создаем новый
          await db.saveCurrentProgress(initialGoal, 0, now.toISOString());
          setDailyGoal(initialGoal);
          setCurrentGlasses(0);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [initialGoal, isNewDay, saveProgressToStatistics]);

  // Обновление прогресса
  const updateProgress = useCallback(async (glasses: number) => {
    try {
      const now = new Date();
      const currentProgress = await db.getCurrentProgress();

      if (currentProgress && isNewDay(now, new Date(currentProgress.lastUpdate))) {
        await saveProgressToStatistics(currentProgress);
        await db.saveCurrentProgress(dailyGoal, glasses, now.toISOString());
      } else {
        await db.saveCurrentProgress(dailyGoal, glasses, now.toISOString());
      }

      setCurrentGlasses(glasses);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [dailyGoal, saveProgressToStatistics, isNewDay]);

  // Обновление цели
  const updateGoal = useCallback(async (newGoal: number) => {
    try {
      console.log('useWaterProgress.updateGoal вызван с:', newGoal);
      const now = new Date();
      const currentProgress = await db.getCurrentProgress();

      if (currentProgress && isNewDay(now, new Date(currentProgress.lastUpdate))) {
        console.log('useWaterProgress: новый день, сохраняем статистику');
        await saveProgressToStatistics(currentProgress);
        const newGlasses = 0;
        await db.saveCurrentProgress(newGoal, newGlasses, now.toISOString());
        setCurrentGlasses(newGlasses);
      } else {
        console.log('useWaterProgress: тот же день, обновляем цель');
        const newGlasses = Math.min(currentGlasses, newGoal);
        await db.saveCurrentProgress(newGoal, newGlasses, now.toISOString());
        setCurrentGlasses(newGlasses);
      }

      console.log('useWaterProgress: устанавливаем новую цель:', newGoal);
      setDailyGoal(newGoal);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  }, [currentGlasses, saveProgressToStatistics, isNewDay]);

  // Обновление исторических данных
  const updateHistoricalProgress = useCallback(async (date: string, glasses: number) => {
    try {
      await db.updateDayStatistics(date, glasses);

      // Обновляем локальное состояние статистики
      setStatistics(prevStats => {
        return prevStats.map(stat => {
          if (stat.date === date) {
            const percentage = (glasses / stat.goal) * 100;
            return {
              ...stat,
              glassesDrunk: glasses,
              percentage,
              motivation: getMotivationMessage(percentage)
            };
          }
          return stat;
        });
      });
    } catch (error) {
      console.error('Error updating historical progress:', error);
    }
  }, []);

  return {
    dailyGoal,
    currentGlasses,
    statistics,
    isLoading,
    updateProgress,
    updateGoal,
    updateHistoricalProgress
  };
};
