import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SessionCreateScreen } from '../../src/screens/parent/SessionCreateScreen';
import { useParentSessionViewModel } from '../../src/viewmodels/useParentSessionViewModel';
import { IntroScreen } from '../../src/screens/IntroScreen';
import ParentDashboard from './dashboard';
import TutorialDemo from '../../app/parent/TutorialScreen';
import { colors, spacing } from '../../src/theme/tokens';


export default function ParentDashboardRoute() {
  const { state, error, startTutorial, completeTutorial } = useParentSessionViewModel();

  // Local only — tracks whether *this* device has played the lore intro for
  // the current tutorial, same as every child does independently. Both see
  // it starting from the same 'tutorial' broadcast, so they stay in sync
  // without the server needing to know or care who's seen it.
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
    default:
      console.log("other screen: ", state.status)
      return;
    // case 'won':
    // case 'lost':
    //   return <ResultScreen result={state.status} />;
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
