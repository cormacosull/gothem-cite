import { View, Text, StyleSheet, ScrollView, Pressable, } from 'react-native';
import { scale } from 'react-native-size-matters';
import { colors } from '../../src/theme/tokens';
import { router } from 'expo-router';

const Alerts = () => {
  type AlertLine = {
    status: string;
    perpetrator: string;
    problem: string;
    playerDispatched: string;
  };
  type Column = {
    key: keyof AlertLine,
    label: string,
    width: `${number}%`
  }
  const sampleAlerts: AlertLine[] =
    [
      {
        status: "Unresolved",
        perpetrator: "The Jester",
        problem: "Fire at the Complex",
        playerDispatched: "Player 1",
      },
      {
        status: "Unresolved",
        perpetrator: "The Pidgeon",
        problem: "Police chase on I-90",
        playerDispatched: "Player 2",
      },
      {
        status: "Unresolved",
        perpetrator: "The Puzzer",
        problem: "Bomb threat at the Town Hall",
        playerDispatched: "Player 3",
      },
      {
        status: "Resolved",
        perpetrator: "The Jester",
        problem: "Fire at the Mall",
        playerDispatched: "Player 1",
      }
    ];

  const COLUMNS: Column[] = [
    { key: "status", label: "Status", width: "15%" },
    { key: "perpetrator", label: "Perpetrator", width: "25%" },
    { key: "problem", label: "Problem", width: "35%" },
    { key: "playerDispatched", label: "Dispatched", width: "25%" },
  ];

  const Header = () => (
    <View style={styles.alertLine}>
      {COLUMNS.map((col) => (
        <Text key={col.key} style={[styles.alertHeaderCol, { width: col.width }]}>
          {col.label.toUpperCase()}
        </Text>
      ))}
    </View>
  );


  type LineProps = {
    alert: AlertLine;
    index: number;
  };
  const Line = ({ alert, index }: LineProps) => (
    <View style={[styles.alertLine, index % 2 === 0 ? { backgroundColor: "rgba(255, 255, 255, 0.06)" } : { backgroundColor: "transparent" }]}>
      {COLUMNS.map((col) => (
        <Text key={col.key} style={[styles.alertLineCol, { width: col.width }]}>
          {col.key === "status"
            ? <Text style={alert.status === "Resolved" ? styles.statusResolved : styles.statusOpen}>{alert.status}</Text>
            : alert[col.key]}
        </Text>
      ))}
    </View>
  );

  return (
    <View>
      <View style={styles.alertHeaderLine}><Header /></View>
      <ScrollView>
        {sampleAlerts.map((alert, i) => (
          <Line key={i} alert={alert} index={i} />
        ))}
      </ScrollView>
    </View>
  )
}

export default function ParentDashboard() {

  return (
    <View style={styles.layout}>
      <Pressable style={styles.backButton}
      onPress={router.back}>
        <Text style={styles.buttonText}>
          X
        </Text>
      </Pressable>

      <View style={styles.topBar}>
        <View style={[styles.cameraBox, {backgroundColor:"green"}]} />
        <View style={[styles.cameraBox, {backgroundColor:"white"}]} />
        <View style={[styles.cameraBox, {backgroundColor:"orange"}]} />
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarMain}>
          <Alerts />
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
    flexDirection: "column"
  },
  backButton:{
    position: "absolute",
    top: scale(5),
    right: scale(5),
    width: scale(30),
    height: scale(30),
    borderRadius: scale(5),
    borderWidth: scale(3),
    borderColor: "red",
    backgroundColor: colors.paper,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText:{
    fontSize: scale(25),
    color: colors.ink,
    textAlign: "center"
  },
  topBar: {
    width: "80%",
    height: "40%",
    backgroundColor: "grey",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: scale(20),
    borderColor: "black",
    borderWidth: scale(4),

  },
  cameraBox: {
    width: scale(160),
    height: scale(120),
    borderRadius: scale(20),
    borderColor: "black",
    borderBottomWidth: scale(15),
    borderTopWidth: scale(15),
    borderRightWidth: scale(6),
    borderLeftWidth: scale(6),
  },
  bottomBar: {
    width: "80%",
    height: "40%",
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
    letterSpacing: 0.5,
  },
  alertLine: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: scale(5),
    paddingHorizontal: scale(6),
  },

  alertLineCol: {
    fontSize: scale(10),
    color: "white",
  },
  statusOpen: {
    color: colors.alarm,
    fontWeight: "bold",
  },
  statusResolved: {
    color: colors.resolved,
    fontWeight: "bold",
  },

})