import { router } from 'expo-router';
import { SessionCreateScreen } from '../../src/screens/parent/SessionCreateScreen';

export default function ParentDashboardRoute() {
  return (
    <SessionCreateScreen
      onGameStart={() => {
        router.push('/parent/dashboard');
      }}
    />
  );
}
