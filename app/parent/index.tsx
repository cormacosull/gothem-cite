import { SessionCreateScreen } from '../../src/screens/parent/SessionCreateScreen';

export default function ParentDashboardRoute() {
  return (
    <SessionCreateScreen
      onGameStart={() => {
        // TODO: replace with router.push('/parent/dashboard') once the live dashboard screen exists (Phase 3).
        console.log('game started — next: navigate to the live dashboard');
      }}
    />
  );
}
