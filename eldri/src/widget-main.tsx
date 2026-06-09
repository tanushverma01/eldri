import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import Widget from './Widget'; // The widget component we built earlier
import './index.css'; // Use the same Tailwind styles

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Widget />
  </StrictMode>
);