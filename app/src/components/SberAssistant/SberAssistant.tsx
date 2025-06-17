import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

interface AssistantAppState {
  [key: string]: unknown;
  water_tracker: {
    current_glasses: number;
    goal_glasses: number;
  };
}


interface SberAssistantProps {
  currentGlasses: number;
  goalGlasses: number;
  onAddWater: (quantity?: number) => void;
  onRemoveWater: (quantity?: number) => void;
  onSetGoal: (glasses: number) => void;
}

const isDev = import.meta.env.MODE === 'development';

// Функция для преобразования словесных чисел в цифровые
const wordToNumber = (word: string): number => {
  const numbers: { [key: string]: number } = {
    'один': 1, 'одну': 1, 'одна': 1,
    'два': 2, 'две': 2,
    'три': 3,
    'четыре': 4,
    'пять': 5,
    'шесть': 6,
    'семь': 7,
    'восемь': 8,
    'девять': 9,
    'десять': 10,
    'одиннадцать': 11,
    'двенадцать': 12,
    'тринадцать': 13,
    'четырнадцать': 14,
    'пятнадцать': 15,
    'шестнадцать': 16,
    'семнадцать': 17,
    'восемнадцать': 18,
    'девятнадцать': 19,
    'двадцать': 20,
    'тридцать': 30,
    'сорок': 40,
    'пятьдесят': 50
  };

  const words = word.toLowerCase().trim().split(' ');

  // Если одно слово, пробуем найти его в словаре
  if (words.length === 1) {
    return numbers[words[0]] || NaN;
  }

  // Если два слова (например, "двадцать пять")
  if (words.length === 2) {
    const tens = numbers[words[0]];
    const ones = numbers[words[1]];
    if (tens && ones && tens % 10 === 0) {
      return tens + ones;
    }
  }

  return NaN;
};

const initializeAssistant = (
  getState: () => AssistantAppState
) => {
  if (isDev) {
    return createSmartappDebugger({
      token: import.meta.env.VITE_SMARTAPP_TOKEN!,
      initPhrase: `Запусти ${import.meta.env.VITE_APP_SMARTAPP}`,
      getState,
      nativePanel: {
        defaultText: '"Добавь 1 стакан воды" или "Установи цель 8 стаканов"',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  }

  return createAssistant({ getState });
};

export const SberAssistant = ({
  currentGlasses,
  goalGlasses,
  onAddWater,
  onRemoveWater,
  onSetGoal
}: SberAssistantProps) => {
  const assistantRef = useRef<ReturnType<typeof createAssistant>>();

  const getStateForAssistant = useCallback(() => {
    return {
      water_tracker: {
        current_glasses: currentGlasses,
        goal_glasses: goalGlasses
      }
    };
  }, [currentGlasses, goalGlasses]);

  useEffect(() => {
    const assistant = initializeAssistant(getStateForAssistant);
    assistantRef.current = assistant;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assistant.on('data', (event: any) => {
      console.log('Получено событие от ассистента:', event);

      if (event.action) {
        console.log('Тип действия:', event.action.type);
        console.log('Данные действия:', event.action);

        let quantity: number;
        let glasses: number;

        switch (event.action.type) {
          case 'add_water':
            // Пробуем сначала преобразовать как число
            quantity = Number(event.action.number);

            // Если получили NaN, пробуем преобразовать из слова
            if (isNaN(quantity) && typeof event.action.number === 'string') {
              quantity = wordToNumber(event.action.number);
            }

            console.log('Количество стаканов для добавления:', quantity, 'Тип:', typeof quantity);

            if (!isNaN(quantity) && quantity > 0) {
              console.log('Добавляем стаканы:', quantity);
              onAddWater(quantity);
            } else {
              console.log('Некорректное количество стаканов');
            }
            break;
          case 'remove_water':
            // Пробуем сначала преобразовать как число
            quantity = Number(event.action.number);

            // Если получили NaN, пробуем преобразовать из слова
            if (isNaN(quantity) && typeof event.action.number === 'string') {
              quantity = wordToNumber(event.action.number);
            }

            console.log('Количество стаканов для удаления:', quantity, 'Тип:', typeof quantity);

            if (!isNaN(quantity) && quantity > 0) {
              console.log('Удаляем стаканы:', quantity);
              onRemoveWater(quantity);
            } else {
              console.log('Некорректное количество стаканов');
            }
            break;
          case 'set_goal':
            console.log('SberAssistant: получена команда установки цели');
            glasses = Number(event.action.glasses);
            console.log('SberAssistant: преобразованное значение:', glasses);
            if (isNaN(glasses) && typeof event.action.glasses === 'string') {
              console.log('SberAssistant: пробуем преобразовать слово в число:', event.action.glasses);
              glasses = wordToNumber(event.action.glasses);
              console.log('SberAssistant: результат преобразования:', glasses);
            }
            if (!isNaN(glasses) && glasses > 0) {
              console.log('SberAssistant: вызываем onSetGoal с:', glasses);
              onSetGoal(glasses);
            }
            break;
        }
      }
    });

    return () => {
    };
  }, [getStateForAssistant, onAddWater, onRemoveWater, onSetGoal]);

  return null;
};
