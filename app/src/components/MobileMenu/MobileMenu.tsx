import React, { useState } from 'react';
import styles from './MobileMenu.module.scss';
import { Statistics } from '../Statistics/Statistics';
import { Help } from '../Help/Help';
import { DailyProgress } from '../../types/statistics';

interface MobileMenuProps {
  statistics: DailyProgress[];
  onUpdateProgress?: (date: string, glasses: number) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ statistics, onUpdateProgress }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'help'>('stats');

  return (
    <div className={styles.mobileMenu}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'help' ? styles.active : ''}`}
          onClick={() => setActiveTab('help')}
        >
          Справка
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'stats' ? (
          <Statistics items={statistics} onUpdateProgress={onUpdateProgress} />
        ) : (
          <Help />
        )}
      </div>
    </div>
  );
};
