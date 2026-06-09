import Dashboard from './Dashboard';
import Widget from './Widget';

export default function App() {
  // Check the URL parameters to see which window Tauri is trying to open
  const urlParams = new URLSearchParams(window.location.search);
  const windowType = urlParams.get('window');

  // If Tauri asks for the widget, render only the Widget UI
  if (windowType === 'widget') {
    return <Widget />;
  }

  // Otherwise, default to the main Dashboard UI
  return <Dashboard />;
}