import AdminConsoleView from '@/components/admin/AdminConsoleView';

export const metadata = {
  title: 'Admin Dashboard',
};

export default function AdminDashboardPage() {
  return <AdminConsoleView defaultTab="overview" />;
}

