import React, { useState } from 'react';
import styles from './Statistics.module.scss';
import { DailyProgress } from '../../types/statistics';

interface StatisticsProps {
  items: DailyProgress[];
  onUpdateProgress?: (date: string, glasses: number) => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ items, onUpdateProgress }) => {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | number>(0);

  const handleEdit = (item: DailyProgress) => {
    setEditingDate(item.date);
    setEditingValue(item.glassesDrunk);
  };

  const handleSave = (item: DailyProgress) => {
    if (onUpdateProgress) {
      const value = typeof editingValue === 'number' ? editingValue : parseInt(editingValue) || 0;
      if (value >= 0) {
        onUpdateProgress(item.date, value);
      }
    }
    setEditingDate(null);
  };

  const handleCancel = () => {
    setEditingDate(null);
  };

  return (
    <div className={styles.statistics}>
      <h2>Статистика</h2>
      {items.length === 0 ? (
        <p className={styles.empty}>История пока пуста. Начните отслеживать потребление воды!</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.date} className={styles.item}>
              <div className={styles.date}>
                {new Date(item.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className={styles.info}>
                <div className={styles.progress}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                  <span className={styles.percentage}>{Math.round(item.percentage)}%</span>
                </div>
                <div className={styles.details}>
                  {editingDate === item.date ? (
                    <div className={styles.editControls}>
                      <input
                        type="number"
                        min="0"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
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
                        className={styles.editInput}
                      />
                      <div className={styles.editButtons}>
                        <button
                          onClick={() => handleSave(item)}
                          className={styles.saveButton}
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancel}
                          className={styles.cancelButton}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>Выпито {item.glassesDrunk} из {item.goal} стаканов</span>
                      {onUpdateProgress && (
                        <button
                          onClick={() => handleEdit(item)}
                          className={styles.editButton}
                        >
                          Изменить
                        </button>
                      )}
                    </>
                  )}
                </div>
                <p className={styles.motivation}>{item.motivation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
