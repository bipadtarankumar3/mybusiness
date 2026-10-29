import AdminConsoleView from '@/components/admin/AdminConsoleView';

export const metadata = {
  title: 'Visit User Dashboard — Super Admin',
};

export default function AdminVisitUserPage() {
  return <AdminConsoleView defaultTab="visit" />;
}

