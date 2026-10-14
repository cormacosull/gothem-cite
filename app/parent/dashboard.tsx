import { View, Text, StyleSheet, ScrollView, Pressable, } from 'react-native';
import { scale } from '../../src/lib/scale';
import { colors } from '../../src/theme/tokens';
import { router } from 'expo-router';
import type { GameState, MissionType } from '../../src/lib/protocol';

const missionLabels: Record<MissionType, string> = {
  fire: "Fire response",
  chase: "Pursuit",
  bomb: "Bomb threat",
};

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
  const alerts = state.missions.map((mission): AlertLine => {
    const player = state.players.find((candidate) => candidate.id === mission.playerId);
    return {
      status: mission.status === 'success' ? 'Resolved' : mission.status === 'failed' ? 'Failed' : 'Unresolved',
      perpetrator: '-',
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
          <View key={state.missions[index].id} style={[styles.alertLine, index % 2 === 0 && styles.alertLineAlternate]}>
            {columns.map((column) => (
              <Text key={column.key} style={[styles.alertLineCol, { width: column.width }]}>
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
  const cityHealth = Math.max(0, Math.min(100, state.cityHealth));

  return (
    <View style={styles.layout}>
      <Pressable style={styles.backButton}
      onPress={router.back}>
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
          <View style={[styles.healthFill, { width: `${cityHealth}%` }, cityHealth <= 25 && styles.healthCritical]} />
        </View>
      </View>

      <View style={styles.topBar}>
        <View style={[styles.cameraBox, {backgroundColor:"green"}]} />
        <View style={[styles.cameraBox, {backgroundColor:"white"}]} />
        <View style={[styles.cameraBox, {backgroundColor:"orange"}]} />
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
  backButton:{
    position: "absolute",
    top: scale(5),
    right: scale(5),
    width: scale(30),
    height: scale(30),
    borderRadius: scale(5),
    borderWidth: scale(3),
    borderColor: colors.alarm,
    backgroundColor: colors.paper,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText:{
    fontSize: scale(25),
    color: colors.ink,
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
    fontWeight: "bold",
  },
  healthHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthValue: {
    color: colors.signal,
    fontSize: scale(13),
    fontWeight: "bold",
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
  healthCritical: {
    backgroundColor: colors.alarm,
  },
  topBar: {
    width: "80%",
    height: "37.5%",
    backgroundColor: "grey",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: scale(20),
    borderColor: "black",
    borderWidth: scale(4),
  },
  cameraBox: {
    width: scale(145),
    height: scale(120),
    maxWidth: "30%",
    borderRadius: scale(20),
    borderColor: "black",
    borderBottomWidth: scale(15),
    borderTopWidth: scale(15),
    borderRightWidth: scale(6),
    borderLeftWidth: scale(6),
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
    fontWeight: "bold",
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
  statusColumn: {
    width: "25%",
  },
  problemColumn: {
    width: "45%",
  },
  playerColumn: {
    width: "30%",
  },
  statusOpen: {
    color: colors.alarm,
    fontWeight: "bold",
  },
  statusResolved: {
    color: colors.resolved,
    fontWeight: "bold",
  },
  statusFailed: {
    color: colors.alarm,
    fontWeight: "bold",
  },
  emptyMessage: {
    color: colors.textMuted,
    fontSize: scale(13),
    paddingVertical: scale(16),
    paddingHorizontal: scale(6),
  },
});