import '@designcodeio/threeui/style.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KageLandingPage } from '../shaders/landing-pages/LandingPages';

export function KageLandingWrapper() {
  const navigate = useNavigate();
  const { user, openSignIn } = useAuth();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'rentkaro-navigate' && typeof data.path === 'string') {
        if (data.path === '/listings/new' && !user) {
          openSignIn('/listings/new');
          return;
        }
        navigate(data.path);
      } else if (data.type === 'rentkaro-action' && data.action === 'google-signin') {
        if (user) {
          navigate('/dashboard');
        } else {
          openSignIn('/browse');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, openSignIn, user]);

  return (
    <div
      className="shader-frame w-full overflow-hidden"
      style={{ width: '100%', height: '100dvh', minHeight: '100vh' }}
    >
      <KageLandingPage
        headingFont="onest"
        bodyFont="onest"
        headingWeight="400"
        bodyWeight="300"
        headingSize={46}
        bodySize={17}
        headingLetterSpacing={-0.012}
        primaryColor="#e63f24"
        style={{ width: '100%', height: '100%', minHeight: '100vh' }}
      />
    </div>
  );
}
