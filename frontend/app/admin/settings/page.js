import AdminConsoleView from '@/components/admin/AdminConsoleView';

export const metadata = {
  title: 'User Access & Settings — Super Admin',
};

export default function AdminSettingsPage() {
  return <AdminConsoleView defaultTab="settings" />;
}

