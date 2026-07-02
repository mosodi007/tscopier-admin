import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const authed = sessionStorage.getItem('admin_authed') === 'true';
  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
