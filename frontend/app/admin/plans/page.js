import AdminConsoleView from '@/components/admin/AdminConsoleView';

export const metadata = {
  title: 'Subscription Plans — Super Admin',
};

export default function AdminPlansPage() {
  return <AdminConsoleView defaultTab="plans" />;
}

