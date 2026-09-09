import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export function useRouteGuard(requiredRole = null) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (requiredRole === 'coach' && user.role !== 'coach' && user.role !== 'admin') {
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, requiredRole, router]);

  return user;
}