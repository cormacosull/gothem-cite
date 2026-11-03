import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSessionViewModel } from '../../viewmodels/useSessionViewModel';
import { CodeInput } from '../../components/CodeInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CharacterCard } from '../../components/CharacterCard';
import { CHARACTERS } from '../../lib/characters';
import { IntroScreen } from '../IntroScreen';
import { StandbyScreen } from './StandbyScreen';
import { InterludeScreen } from './InterludeScreen';
import { GameOverScreen } from './GameOverScreen';
import { ChaseScreen } from './chase/ChaseScreen';
import { FireScreen } from './fire/FireScreen';
import { PuzzlerScreen } from './puzzler/PuzzlerScreen';
import { colors, spacing, radii, inkShadow } from '../../theme/tokens';

interface Props {
  onGameStart?: () => void;
}

export function JoinScreen({ onGameStart }: Props) {
  const {
    code,
    setCode,
    name,
    setName,
    phase,
    errorText,
    players,
    isConnected,
    join,
    canJoin,
    selectedCharacterId,
    takenCharacterIds,
    selectCharacter,
    finishIntro,
    mission,
    nextMission,
    reportMissionResult,
    continueAfterMission,
    cityHealth,
    healthChange,
    interludeSecondsLeft,
    gameResult,
  } = useSessionViewModel({ onGameStart });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {Platform.OS == 'web' && (
        <Text style={styles.wordmark}>Gothem Cité</Text>
      )}
      {phase !== 'intro' && phase !== 'standby' && phase !== 'interlude' && phase !== 'gameOver' && (
        <Text style={styles.tagline}>
          {phase === 'selecting'
            ? 'Pick your hero'
            : phase === 'waiting'
              ? 'Standing by for the signal'
              : 'Answer the call. Save the city.'}
        </Text>
      )}

      {(phase === 'entering' || phase === 'joining' || phase === 'error') && (
        <View style={styles.form}>
          <Text style={styles.label}>Mission code</Text>
          <CodeInput value={code} onChange={setCode} editable={phase !== 'joining'} />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Hero alias</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="What do they call you?"
            placeholderTextColor={colors.textMuted}
            maxLength={16}
            editable={phase !== 'joining'}
          />

          {phase === 'error' && <Text style={styles.error}>{errorText}</Text>}

          <View style={styles.ctaRow}>
            {phase === 'joining' ? (
              <ActivityIndicator color={colors.signal} />
            ) : (
              <PrimaryButton label="Join the fight" onPress={join} disabled={!canJoin} />
            )}
          </View>

          {!isConnected && <Text style={styles.hint}>Connecting to mission control…</Text>}
        </View>
      )}

      {phase === 'selecting' && (
        <View style={styles.form}>
          <View style={styles.characterGrid}>
            {CHARACTERS.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                selected={c.id === selectedCharacterId}
                disabled={takenCharacterIds.includes(c.id)}
                onPress={() => selectCharacter(c.id)}
              />
            ))}
          </View>
        </View>
      )}

      {phase === 'intro' && <IntroScreen players={players} onFinish={finishIntro} />}

      {phase === 'standby' && mission?.type === 'chase' && (
        <ChaseScreen onFinish={reportMissionResult} onContinue={continueAfterMission} />
      )}

      {phase === 'standby' && mission?.type === 'fire' && (
        <FireScreen onFinish={reportMissionResult} onContinue={continueAfterMission} />
      )}

      {phase === 'standby' && mission?.type === 'bomb' && (
        <PuzzlerScreen onFinish={reportMissionResult} onContinue={continueAfterMission} />
      )}

      {phase === 'standby' && !mission && (
        <StandbyScreen selectedCharacterId={selectedCharacterId} />
      )}

      {phase === 'interlude' && (
        <InterludeScreen
          cityHealth={cityHealth}
          healthChange={healthChange}
          nextMission={nextMission}
          secondsLeft={interludeSecondsLeft}
        />
      )}

      {phase === 'gameOver' && gameResult && (
        <GameOverScreen result={gameResult} cityHealth={cityHealth} />
      )}

      {phase === 'waiting' && (
        <View style={styles.form}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{code}</Text>
          </View>
          <Text style={styles.subheading}>On the roster</Text>
          {players.map((p) => (
            <Text key={p.id} style={styles.playerRow}>
              • {p.name}
            </Text>
          ))}
          <Text style={styles.hint}>Mission control will start the game shortly.</Text>
          {!isConnected && <Text style={styles.hint}>Reconnecting…</Text>}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  wordmark: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 48,
    color: colors.signal,
    letterSpacing: 1,
    textShadowColor: colors.inkLine,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  tagline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: colors.textOnInk,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.textOnInk,
    marginBottom: spacing.sm,
  },
  nameInput: {
    width: '100%',
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: colors.inkLine,
  },
  ctaRow: {
    marginTop: spacing.lg,
  },
  error: {
    fontFamily: 'Nunito_700Bold',
    color: colors.alarm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 13,
  },
  subheading: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textOnInk,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  playerRow: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnInk,
    fontSize: 16,
  },
  codeBadge: {
    backgroundColor: colors.panel,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...inkShadow(3),
  },
  codeBadgeText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 28,
    color: colors.signal,
    letterSpacing: 4,
  },
});
