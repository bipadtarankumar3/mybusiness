import '@/styles/dashboard.css';
import { AuthProvider } from '@/hooks/useAuth';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
