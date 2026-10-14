import { JoinScreen } from "../../src/screens/child/JoinScreen";

export default function ChildJoinRoute() {
  return (
    <JoinScreen
      onGameStart={() => {
        // Fires once the intro finishes; the screen moves to a "Standing
        // By" placeholder. TODO: once mission assignment is wired up and
        // minigame routes exist, navigate to router.push('/child/mission')
        // when this player's mission actually arrives, instead of sitting
        // on the standby screen indefinitely.
        console.log('intro finished — on standby for a mission assignment');
      }}
    />
  );
}
