import '@/styles/dashboard.css';
import { AuthProvider } from '@/hooks/useAuth';
import UserShell from '@/components/user/UserShell';

export const metadata = {
  title: 'User Workspace Dashboard',
};

export default function UserLayout({ children }) {
  return (
    <AuthProvider>
      <UserShell>{children}</UserShell>
    </AuthProvider>
  );
}

