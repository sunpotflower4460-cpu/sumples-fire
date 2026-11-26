import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { initializeAppStorage } from './lib/appStorage';
import { plusStore } from './plus/plusStore';
import { AppModalIsolation } from './components/AppModalIsolation';
import { AppScreenAnnouncer } from './components/AppScreenAnnouncer';
import './styles.css';
import './fireTaskEffects.css';
import './rewardEffects.css';
import './flameMobile.css';
import './formUx.css';
import './rewardProgress.css';
import './comfortSettings.css';
import './burningRitual.css';
import './darkTheme.css';
import './campfire.css';
import './ashLegacy.css';
import './worldClassPolish.css';
import './hierarchyPolish.css';
import './taskCardPolish.css';
import './interactionPolish.css';
import './nativeFinishPolish.css';
import './ritualFlowPolish.css';
import './flowContinuityPolish.css';
import './archiveScalePolish.css';
import './settingsHierarchyPolish.css';
import './decisionClarityPolish.css';
import './undoActionPolish.css';
import './focusQueuePolish.css';
import './experiencePolish.css';
import './capturePolish.css';
import './ritualFeedbackPolish.css';
import './actionEntryPolish.css';
import './mobileViewportPolish.css';
import './screenReaderPolish.css';
import './textScaleResilience.css';
import './dialogViewportPolish.css';
import './choiceSemanticsPolish.css';
import './touchInteractionPolish.css';
import './accessibilityPolish.css';
import './dimensionalPolish.css';
import './tactilePolish.css';
import './japaneseWrap.css';
import './lightThemeContrast.css';
import './plus/plus.css';

// Durable storage must be ready before the first render: every hook reads its
// initial state synchronously, and rendering early would show an empty list.
void initializeAppStorage().finally(() => {
  // Saved Plus preferences load with the rest of durable storage, before the
  // first render. Talking to the store (price, entitlement) never delays it.
  plusStore.hydrate();
  void plusStore.init();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <App />
        <AppModalIsolation />
        <AppScreenAnnouncer />
      </MotionConfig>
    </StrictMode>,
  );
});
