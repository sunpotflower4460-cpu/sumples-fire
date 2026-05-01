import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
