import { useState, useEffect } from 'react';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import LoginScreen from './components/LoginScreen';
import PlanSelectionScreen from './components/PlanSelectionScreen';
import Dashboard from './Dashboard';
import Widget from './Widget';

type AuthState = 'login' | 'plans' | 'authenticated';

function getInitialAuthState(): AuthState {
  const state = localStorage.getItem('eldri_auth_state');
  if (state === 'authenticated') return 'authenticated';
  if (state === 'plans') return 'plans';
  return 'login';
}

// Detect window type from the HTML file path — synchronous, no race condition
function detectWindowLabel(): string {
  try {
    const path = window.location.pathname || '';
    if (path.includes('widget')) return 'widget';
  } catch {
    // ignore
  }
  return 'main';
}

export default function App() {
  const windowLabel = detectWindowLabel();
  const [authState, setAuthState] = useState<AuthState>(() => getInitialAuthState());

  // Set up deep link listener for OAuth callback
  useEffect(() => {
    if (windowLabel !== 'main') return;

    let unsubscribe: (() => void) | undefined;

    const setupDeepLink = async () => {
      try {
        unsubscribe = await onOpenUrl((urls) => {
          console.log('Received deep link urls:', urls);
          for (const urlStr of urls) {
            try {
              const url = new URL(urlStr);
              const isCallback =
                url.host === 'auth-callback' ||
                url.pathname.includes('auth-callback') ||
                url.pathname.includes('callback');

              if (isCallback) {
                let accessToken = url.searchParams.get('access_token');
                let email = url.searchParams.get('email');

                // Fallback to checking hash fragments (common in OAuth redirects)
                if (!accessToken || !email) {
                  const hash = url.hash.startsWith('#') ? url.hash.substring(1) : url.hash;
                  const hashParams = new URLSearchParams(hash);
                  accessToken = accessToken || hashParams.get('access_token') || hashParams.get('token');
                  email = email || hashParams.get('email');
                }

                if (accessToken && email) {
                  localStorage.setItem('eldri_auth_token', accessToken);
                  localStorage.setItem('eldri_auth_email', email);
                  localStorage.setItem('eldri_auth_state', 'plans');
                  setAuthState('plans');
                }
              }
            } catch (e) {
              console.error('Failed to parse deep link URL:', urlStr, e);
            }
          }
        });
      } catch (err) {
        console.error('Failed to register deep link listener:', err);
      }
    };

    setupDeepLink();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [windowLabel]);

  const completeAuth = (plan: string) => {
    localStorage.setItem('eldri_selected_plan', plan);
    localStorage.setItem('eldri_auth_state', 'authenticated');

    // Store trial start date when plan is selected
    if (!localStorage.getItem('eldri_trial_start')) {
      localStorage.setItem('eldri_trial_start', new Date().toISOString());
    }

    setAuthState('authenticated');
  };

  // Widget window renders Widget component directly
  if (windowLabel === 'widget') {
    return <Widget />;
  }

  // Main window auth flow
  if (authState === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          localStorage.setItem('eldri_auth_token', 'test-token');
          localStorage.setItem('eldri_auth_email', 'beta-tester@eldri.app');
          localStorage.setItem('eldri_auth_state', 'plans');
          setAuthState('plans');
        }}
      />
    );
  }

  if (authState === 'plans') {
    return <PlanSelectionScreen onPlanSelected={completeAuth} />;
  }

  // authState === 'authenticated' — render Dashboard
  return (
    <Dashboard
      onSignOut={() => {
        localStorage.removeItem('eldri_auth_state');
        localStorage.removeItem('eldri_auth_token');
        localStorage.removeItem('eldri_auth_email');
        localStorage.removeItem('eldri_selected_plan');
        setAuthState('login');
      }}
    />
  );
}
