import { useRouter } from 'next/router';
import { LoginPage } from '../components/LoginPage';

export default function HomePage() {
  const router = useRouter();
  const { error } = router.query;

  return <LoginPage error={error as string} />;
}
