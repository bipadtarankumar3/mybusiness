import AdminConsoleView from '@/components/admin/AdminConsoleView';

export const metadata = {
  title: 'Users & Workspaces — Super Admin',
};

export default function AdminUsersPage() {
  return <AdminConsoleView defaultTab="users" />;
}

