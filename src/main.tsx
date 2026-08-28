import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
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
import './accessibilityPolish.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
      <AppScreenAnnouncer />
    </MotionConfig>
  </StrictMode>,
);
