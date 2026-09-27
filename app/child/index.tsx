import { JoinScreen } from "../../src/screens/child/JoinScreen";

export default function ChildJoinRoute() {
  return (
    <JoinScreen
      onGameStart={() => {
        // TODO: replace with router.push('/child/mission') once the
        // character-select / minigame routes exist.
        console.log('game started — next: navigate to the assigned minigame');
      }}
    />
  );
}
