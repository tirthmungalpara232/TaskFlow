import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// The backend redirects here after Google/GitHub sign-in with ?token=<jwt>.
// This page just picks that token up, loads the user, then sends them into the app.
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/'))
      .catch(() => setError('Could not complete sign-in. Please try again.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 text-center dark:bg-transparent">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-sm text-slate-400">Signing you in...</p>
      )}
    </div>
  );
};

export default OAuthCallback;
