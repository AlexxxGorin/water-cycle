import { useRef, useState, useEffect } from 'react';
import { WaterTracker } from './components/WaterTracker/WaterTracker';
import { SberAssistant } from './components/SberAssistant';
import styles from './App.module.scss';

interface WaterTrackerMethods {
  addWater: (quantity?: number) => void;
  removeWater: (quanity?: number) => void;
  setGoal: (glasses: number) => void;
  subscribeToChanges: (callback: (state: { current: number; goal: number }) => void) => void;
}

export const App = () => {
  const waterTrackerRef = useRef<WaterTrackerMethods>(null);
  const [currentGlasses, setCurrentGlasses] = useState(0);
  const [goalGlasses, setGoalGlasses] = useState(8);

  useEffect(() => {
    if (waterTrackerRef.current) {
      waterTrackerRef.current.subscribeToChanges(({ current, goal }) => {
        setCurrentGlasses(current);
        setGoalGlasses(goal);
      });
    }
  }, []);

  const handleAddWater = (quantity?: number) => {
    waterTrackerRef.current?.addWater(quantity);
  };

  const handleRemoveWater = (quantity?: number) => {
    waterTrackerRef.current?.removeWater(quantity);
  };

  const handleSetGoal = (glasses: number) => {
    waterTrackerRef.current?.setGoal(glasses);
  };

  return (
    <div className={styles.app}>
      <WaterTracker ref={waterTrackerRef} />
      <SberAssistant
        currentGlasses={currentGlasses}
        goalGlasses={goalGlasses}
        onAddWater={handleAddWater}
        onRemoveWater={handleRemoveWater}
        onSetGoal={handleSetGoal}
      />
    </div>
  );
};
