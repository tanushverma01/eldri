import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import LoginScreen from './components/LoginScreen';
import PlanSelectionScreen from './components/PlanSelectionScreen';
import Dashboard from './Dashboard';
import Widget from './Widget';

type AuthState = 'login' | 'plans' | 'authenticated';

function isAuthenticated(): boolean {
  return localStorage.getItem('eldri_auth_state') === 'authenticated';
}

export default function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>(() =>
    isAuthenticated() ? 'authenticated' : 'login'
  );

  useEffect(() => {
    try {
      setWindowLabel(getCurrentWindow().label);
    } catch {
      setWindowLabel('main');
    }
  }, []);

  const completeAuth = (plan: string) => {
    localStorage.setItem('eldri_selected_plan', plan);
    localStorage.setItem('eldri_auth_state', 'authenticated');
    setAuthState('authenticated');
  };

  if (windowLabel === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif italic font-bold animate-pulse">
          e
        </div>
      </div>
    );
  }

  if (windowLabel === 'widget') {
    return <Widget />;
  }

  if (authState === 'login') {
    return <LoginScreen onLoginSuccess={() => setAuthState('plans')} />;
  }

  if (authState === 'plans') {
    return <PlanSelectionScreen onPlanSelected={completeAuth} />;
  }

  return (
    <Dashboard
      onSignOut={() => {
        localStorage.removeItem('eldri_auth_state');
        setAuthState('login');
      }}
    />
  );
}
