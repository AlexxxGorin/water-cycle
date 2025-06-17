export interface DailyProgress {
  date: string; // ISO string
  goal: number;
  glassesDrunk: number;
  percentage: number;
  motivation: string;
}

export type MotivationLevel = 'excellent' | 'good' | 'average' | 'poor';

export const getMotivationMessage = (percentage: number): string => {
  if (percentage > 150) {
    return 'Внимание! Вы значительно превысили дневную норму. Чрезмерное потребление воды может быть опасно для здоровья. Рекомендуется пересмотреть вашу цель или уменьшить потребление.';
  } else if (percentage > 100) {
    return 'Вы превысили дневную цель. Возможно, стоит увеличить цель, если такое потребление для вас комфортно. Но помните, что избыток воды тоже может быть вреден.';
  } else if (percentage === 100) {
    return 'Отлично! Вы достигли своей цели на сегодня! Продолжайте в том же духе!';
  } else if (percentage >= 80) {
    return 'Почти получилось! Вы очень близки к цели. В следующий раз обязательно получится!';
  } else if (percentage >= 50) {
    return 'Неплохо! Вы на правильном пути. Постарайтесь выпить еще немного воды завтра!';
  } else if (percentage >= 30) {
    return 'Начало положено! Попробуйте увеличить количество воды в следующий раз.';
  } else {
    return 'Не забывайте пить воду! Это важно для вашего здоровья. Давайте попробуем достичь цели завтра!';
  }
};
