import '@/styles/dashboard.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata = {
  title: 'Account Access',
};

export default function AuthLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
