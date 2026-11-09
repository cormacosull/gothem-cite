import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SessionCreateScreen } from '../../src/screens/parent/SessionCreateScreen';
import { useParentSessionViewModel } from '../../src/viewmodels/useParentSessionViewModel';
import { IntroScreen } from '../../src/screens/IntroScreen';
import ParentDashboard from './dashboard';
import TutorialDemo from '../../app/parent/TutorialScreen';
import { colors, spacing } from '../../src/theme/tokens';
import ResultScreen from '../../src/screens/parent/ResultScreen';


export default function ParentDashboardRoute() {
  const { state, error, startTutorial, completeTutorial, startNewSession } = useParentSessionViewModel();

  //local only, did this device play the intro yet
  //both devices start from the same tutorial broadcast so the server doesn't track it
  const [introSeen, setIntroSeen] = useState(false);
  useEffect(() => {
    if (state?.status === 'lobby') setIntroSeen(false);
  }, [state?.status]);

  if (!state) return <SessionCreateScreen/>;


switch (state.status) {
    case 'lobby':
      return <SessionCreateScreen code={state.code} players={state.players}
                                  error={error} onStart={startTutorial} />;
    case 'tutorial':
      if (!introSeen) {
        return (
          <View style={styles.introWrap}>
            <IntroScreen players={state.players} onFinish={() => setIntroSeen(true)} />
          </View>
        );
      }
      return <TutorialDemo onFinished={completeTutorial} onSkip={completeTutorial} />;
    case 'playing':
      return <ParentDashboard state={state} />;
        case 'won':
    case 'lost':
      return <ResultScreen state={state} onPlayAgain={startNewSession} />;
    default:
      return;
  }
}

const styles = StyleSheet.create({
  introWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
