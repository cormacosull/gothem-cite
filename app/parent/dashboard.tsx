import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { scale } from '../../src/lib/scale';
import { colors, fonts } from '../../src/theme/tokens';
import { router } from 'expo-router';
import type { GameState, MissionType } from '../../src/lib/protocol';
import firePreview from '../../assets/previews/fire.png';
import chasePreview from '../../assets/previews/chase.png';
import bombPreview from '../../assets/previews/bomb.png';
import dashboardBackground from '../../assets/dashboard-bg.png';
import { VILLAINS } from '../../src/lib/villains';

const missionLabels: Record<MissionType, string> = {
  fire: "Fire response",
  chase: "Pursuit",
  bomb: "Bomb threat",
};

const missionPreviews: Record<MissionType, number> = {
  fire: firePreview,
  chase: chasePreview,
  bomb: bombPreview,
};

const STARTING_CITY_HEALTH = 50;
const WIN_CITY_HEALTH = 75;
const MISSIONS_PER_PLAYER = 3;

function MissionBoard({ state }: { state: GameState }) {
  type AlertLine = {
    status: string;
    perpetrator: string;
    problem: string;
    playerDispatched: string;
  };
  const columns: { key: keyof AlertLine; label: string; width: `${number}%` }[] = [
    { key: 'status', label: 'Status', width: '15%' },
    { key: 'perpetrator', label: 'Perpetrator', width: '25%' },
    { key: 'problem', label: 'Problem', width: '35%' },
    { key: 'playerDispatched', label: 'Dispatched', width: '25%' },
  ];
  const missions = [...state.missions].reverse();
  const alerts = missions.map((mission): AlertLine => {
    const player = state.players.find((candidate) => candidate.id === mission.playerId);
    const villain = VILLAINS.find((candidate) => candidate.id === mission.type);
    return {
      status: mission.status === 'success' ? 'Resolved' : mission.status === 'failed' ? 'Failed' : 'Unresolved',
      perpetrator: villain?.name ?? '-',
      problem: missionLabels[mission.type],
      playerDispatched: player?.name ?? 'Unknown hero',
    };
  });

  return (
    <View>
      <View style={styles.alertHeaderLine}>
        <View style={styles.alertLine}>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.alertHeaderCol, { width: column.width }]}>
              {column.label.toUpperCase()}
            </Text>
          ))}
        </View>
      </View>
      <ScrollView>
        {alerts.length === 0 ? (
          <Text style={styles.emptyMessage}>No missions have been assigned.</Text>
        ) : alerts.map((alert, index) => (
          <View key={missions[index].id} style={[styles.alertLine, index % 2 === 0 && styles.alertLineAlternate]}>
            {columns.map((column) => (    <Text key={column.key} style={[styles.alertLineCol, { width: column.width }]}>
                {column.key === 'status' ? (
                  <Text style={alert.status === 'Resolved' ? styles.statusResolved : alert.status === 'Failed' ? styles.statusFailed : styles.statusOpen}>
                    {alert.status}
                  </Text>
                ) : alert[column.key]}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function ParentDashboard({ state }: { state: GameState }) {
  const cityHealth = Math.round(Math.max(0, Math.min(100, state.cityHealth)));

  return (
    <View style={styles.layout}>
      <Image source={dashboardBackground} style={styles.backgroundImage} resizeMode="cover" />
      <Pressable style={styles.backButton}
      onPress={() => router.back()}>
        <Text style={styles.buttonText}>
          X
        </Text>
      </Pressable>

      <View style={styles.healthTimer}>
        <View style={styles.healthHeading}>
          <Text style={styles.healthLabel}>CITY HEALTH</Text>
          <Text style={styles.healthValue}>{cityHealth}%</Text>
        </View>
        <View style={styles.healthTrack}>
          <View
            style={[
              styles.healthFill,
              { width: `${cityHealth}%` },
              cityHealth < WIN_CITY_HEALTH && styles.healthBelowGoal,
              cityHealth < STARTING_CITY_HEALTH && styles.healthCritical,
            ]}
          />
        </View>
      </View>

      <View style={styles.topBar}>
        {state.players.map((player) => {
          const mission = state.missions.find((m) => m.playerId === player.id && m.status === 'active');
          const done = state.missions.filter((m) => m.playerId === player.id && m.status !== 'active').length;
          return (
            <View key={player.id} style={styles.camera}>
              <View style={styles.cameraBox}>
                {mission ? (
                  <Image source={missionPreviews[mission.type]} style={styles.cameraImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.cameraEmpty}>✔ Done</Text>
                )}
              </View>
              <Text style={styles.cameraName}>{player.name} · {done}/{MISSIONS_PER_PLAYER}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarMain}>
          <MissionBoard state={state} />
        </View>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  layout: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.ink,
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    flexDirection: "column",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.35,
  },
  backButton:{
    position: "absolute",
    top: scale(5),
    right: scale(5),
    width: scale(22),
    height: scale(22),
    borderRadius: scale(5),
    borderWidth: scale(2),
    borderColor: colors.alarm,
    backgroundColor: colors.alarm,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText:{
    fontSize: scale(16),
    fontWeight: "bold",
    color: colors.paper,
    textAlign: "center",
  },
  healthTimer: {
    width: "80%",
    backgroundColor: colors.panel,
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(4),
    borderColor: colors.inkLine,
    borderWidth: scale(2),
  },
  healthLabel: {
    color: colors.textOnInk,
    fontSize: scale(11),
    fontFamily: fonts.bodyBold,
  },
  healthHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthValue: {
    color: colors.signal,
    fontSize: scale(13),
    fontFamily: fonts.bodyBold,
  },
  healthTrack: {
    height: scale(8),
    backgroundColor: colors.ink,
    borderWidth: scale(1),
    borderColor: colors.inkLine,
    marginTop: scale(5),
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    backgroundColor: colors.resolved,
  },
  healthBelowGoal: {
    backgroundColor: colors.signal,
  },
  healthCritical: {
    backgroundColor: colors.alarm,
  },
  topBar: {
    width: "80%",
    height: "37.5%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  camera: {
    width: "30%",
    height: "100%",
    alignItems: "center",
  },
  cameraBox: {
    width: "100%",
    flex: 1,
    borderRadius: scale(20),
    borderColor: "black",
    borderBottomWidth: scale(15),
    borderTopWidth: scale(15),
    borderRightWidth: scale(6),
    borderLeftWidth: scale(6),
    backgroundColor: colors.ink,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraImage: {
    width: "100%",
    height: "100%",
  },
  cameraEmpty: {
    color: colors.resolved,
    fontSize: scale(12),
    fontWeight: "bold",
  },
  cameraName: {
    color: colors.textOnInk,
    fontSize: scale(11),
    fontWeight: "bold",
    marginTop: scale(4),
  },
  bottomBar: {
    width: "80%",
    height: "35%",
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: scale(4),
  },
  bottomBarMain: {
    flex: 1,
    width: "100%",
  },
  alertHeaderLine: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderBottomWidth: scale(1),
    borderBottomColor: "rgba(255, 255, 255, 0.35)",
    paddingVertical: scale(2),
    borderTopLeftRadius: scale(4),
    borderTopRightRadius: scale(4),
  },
  alertHeaderCol: {
    fontSize: scale(9),
    fontFamily: fonts.bodyBold,
    color: "rgba(255, 255, 255, 0.85)",
  },
  alertLine: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: scale(5),
    paddingHorizontal: scale(6),
  },
  alertLineAlternate: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  alertLineCol: {
    fontSize: scale(10),
    color: "white",
  },
  statusOpen: {
    color: colors.signal,
    fontWeight: "bold",
  },
  statusResolved: {
    color: colors.resolved,
    fontFamily: fonts.bodyBold,
  },
  statusFailed: {
    color: colors.alarm,
    fontFamily: fonts.bodyBold,
  },
  emptyMessage: {
    color: colors.textMuted,
    fontSize: scale(13),
    paddingVertical: scale(16),
    paddingHorizontal: scale(6),
  },
});