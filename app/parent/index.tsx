import { SessionCreateScreen } from '../../src/screens/parent/SessionCreateScreen';
import { useParentSessionViewModel } from '../../src/viewmodels/useParentSessionViewModel';
import ParentDashboard from './dashboard';
import TutorialDemo from '../../app/parent/TutorialScreen';


export default function ParentDashboardRoute() {
  const { state, error, startTutorial, completeTutorial } = useParentSessionViewModel();

  if (!state) return <SessionCreateScreen/>;


switch (state.status) {
    case 'lobby':
      return <SessionCreateScreen code={state.code} players={state.players}
                                  error={error} onStart={startTutorial} />;
    case 'tutorial':
      return <TutorialDemo onFinished={completeTutorial} onSkip={completeTutorial} />;
    case 'playing':
      return <ParentDashboard state={state} />;
    default:
      console.log("other screen: ", state.status)
      return;
    // case 'won':
    // case 'lost':
    //   return <ResultScreen result={state.status} />;
  }
}