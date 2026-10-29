import '@/styles/dashboard.css';
import { AuthProvider } from '@/hooks/useAuth';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Super Admin Console',
};

export default function AdminLayout({ children }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}

