import { PuzzlerScreen } from '../../src/screens/child/puzzler/PuzzlerScreen';

export default function PuzzlerRoute() {
  return (
    <PuzzlerScreen
      onFinish={(success) => {
        // TODO: send mission_result to the server (Step 9)
        console.log('Puzzler finished, success =', success);
      }}
    />
  );
}
