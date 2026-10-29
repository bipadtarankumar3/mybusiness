import AdminConsoleView from '@/components/admin/AdminConsoleView';

export const metadata = {
  title: 'All Subscriptions — Super Admin',
};

export default function AdminSubscriptionsPage() {
  return <AdminConsoleView defaultTab="subscriptions" />;
}

