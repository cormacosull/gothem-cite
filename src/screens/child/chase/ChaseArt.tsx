import { StyleSheet } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import { colors } from '../../../theme/tokens';

const BG_VIEWBOX = { width: 240, height: 420 };
const LANE_COUNT = 3;
const LANE_WIDTH = BG_VIEWBOX.width / LANE_COUNT;
const SIDEWALK_WIDTH = 14;

const DASH_LENGTH = 20;
const DASH_GAP = 16;

const ACCENT_COLORS = [colors.signal, colors.alarm, '#4FD1E8', colors.signal];

//y positions for one lane divider's dashes, reused for both dividers
function buildDashRows(): number[] {
  const rows: number[] = [];
  for (let y = 0; y < BG_VIEWBOX.height; y += DASH_LENGTH + DASH_GAP) rows.push(y);
  return rows;
}

//y positions for the shopfront accents running down both sidewalks
function buildAccentRows(): number[] {
  const rows: number[] = [];
  for (let y = 10; y < BG_VIEWBOX.height; y += 48) rows.push(y);
  return rows;
}

const DASH_ROWS = buildDashRows();
const ACCENT_ROWS = buildAccentRows();

//the 3-lane road, sidewalks and skyline accents behind the chase board
export function ChaseBackground() {
  return (
    <Svg
      viewBox={`0 0 ${BG_VIEWBOX.width} ${BG_VIEWBOX.height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Rect x={0} y={0} width={BG_VIEWBOX.width} height={BG_VIEWBOX.height} fill="#20263B" />

      {/* sidewalks */}
      <Rect x={0} y={0} width={SIDEWALK_WIDTH} height={BG_VIEWBOX.height} fill={colors.inkLine} />
      <Rect
        x={BG_VIEWBOX.width - SIDEWALK_WIDTH}
        y={0}
        width={SIDEWALK_WIDTH}
        height={BG_VIEWBOX.height}
        fill={colors.inkLine}
      />

      {/* shopfront / neon accents along both sidewalks */}
      {ACCENT_ROWS.map((y, i) => (
        <G key={y}>
          <Rect x={2} y={y} width={SIDEWALK_WIDTH - 4} height={16} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} opacity={0.85} />
          <Rect
            x={BG_VIEWBOX.width - SIDEWALK_WIDTH + 2}
            y={y}
            width={SIDEWALK_WIDTH - 4}
            height={16}
            fill={ACCENT_COLORS[(i + 2) % ACCENT_COLORS.length]}
            opacity={0.85}
          />
        </G>
      ))}

      {/* dashed lane dividers, at 1/3 and 2/3 of the road width */}
      {[LANE_WIDTH, LANE_WIDTH * 2].map((x) => (
        <G key={x}>
          {DASH_ROWS.map((y) => (
            <Rect key={y} x={x - 1.5} y={y} width={3} height={DASH_LENGTH} fill={colors.textOnInk} opacity={0.75} />
          ))}
        </G>
      ))}
    </Svg>
  );
}
