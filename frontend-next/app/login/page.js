import LoginClient from './LoginClient';

export const metadata = {
  title: 'Sign in to your account',
  description: 'Sign in to your The Local Jewel account to track orders, quotes, and messages.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
