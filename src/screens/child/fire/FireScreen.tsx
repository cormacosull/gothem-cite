import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent, } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { scale } from 'react-native-size-matters';
import { useFireMissionViewModel } from '../../../viewmodels/useFireMissionViewModel';
import { colors, spacing, radii } from '../../../theme/tokens';
import { ENGINE_ART, ENGINE_LAYOUT, GAME_CONFIG, HOSE_ANCHOR, IMAGE_UNITS, getAimDirection, getFireVisual, convertToImageUnits, type FireLocation, type Point, } from './logic';
import apartments from '../../../../assets/apartments.webp';
import fire from '../../../../assets/fire.png';

const MAP_ASPECT_RATIO = IMAGE_UNITS.width / IMAGE_UNITS.height;
const MAP_BORDER_WIDTH = 3;
const SPRAY_BUTTON_SIZE = scale(82);

interface Props {
  onFinish?: (success: boolean) => void;
  onContinue?: () => void;
}

//https://www.freeiconspng.com/img/44306
//https://www.craiyon.com/en/image/zFcGubeDQYW4_sd5xkBo-Q

export function FireScreen({ onFinish, onContinue }: Props = {}) {
  const {
    locations,
    status,
    timeLeftMs,
    elapsedMs,
    intensities,
    burningCount,
    nozzle,
    landing,
    spraying,
    hitLocation,
    start,
    setNozzle,
    setSpraying,
  } = useFireMissionViewModel({ onFinish });
  const [availableMapSize, setAvailableMapSize] = useState({ width: 0, height: 0 });
  const activeAimTouchId = useRef<number | null>(null);

  useSpaceBarSpray(setSpraying);

  function measureMapStage(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setAvailableMapSize({ width, height });
  }

  const mapWidth = Math.min(
    Math.max(0, availableMapSize.width - MAP_BORDER_WIDTH * 2),
    Math.max(0, availableMapSize.height - MAP_BORDER_WIDTH * 2) * MAP_ASPECT_RATIO
  );
  const mapHeight = mapWidth / MAP_ASPECT_RATIO;

  const handleAimCoordinates = useCallback(
    (locationX: number, locationY: number) => {
      if (mapWidth <= 0 || mapHeight <= 0) return;
      setNozzle({ x: locationX / mapWidth, y: locationY / mapHeight });
    },
    [mapWidth, mapHeight, setNozzle]
  );

  const handleAimEvent = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      handleAimCoordinates(locationX, locationY);
    },
    [handleAimCoordinates]
  );

  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      if (activeAimTouchId.current !== null) return;
      const touch = event.nativeEvent.changedTouches[0];
      if (!touch) return;
      activeAimTouchId.current = touch.identifier;
      handleAimCoordinates(touch.locationX, touch.locationY);
    },
    [handleAimCoordinates]
  );

  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      const touch = event.nativeEvent.changedTouches.find(
        ({ identifier }) => identifier === activeAimTouchId.current
      );
      if (touch) handleAimCoordinates(touch.locationX, touch.locationY);
    },
    [handleAimCoordinates]
  );

  const handleTouchEnd = useCallback((event: GestureResponderEvent) => {
    if (
      event.nativeEvent.changedTouches.some(
        ({ identifier }) => identifier === activeAimTouchId.current
      )
    ) {
      activeAimTouchId.current = null;
    }
  }, []);

  // Native uses raw touch events so one finger can aim while another holds
  // Web uses the responder system so that mouse clicks and drags work too.
  const aimHandlers =
    Platform.OS === 'web'
      ? {
        onStartShouldSetResponder: () => true,
        onResponderGrant: handleAimEvent,
        onResponderMove: handleAimEvent,
      }
      : {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
      };

  return (
    <View style={styles.container}>

      <View style={styles.textInformation}>
        <Text style={styles.title}>The Jester</Text>
        <Text style={styles.subtitle}>Aim the water cannon to put out The Jester's fires</Text>
      </View>

      <View style={styles.body}>

        <View style={styles.west}>
          <View style={styles.hud}>
            <Text style={styles.hudTitles}>Time</Text>
            <View style={styles.timer}>
              <Text style={styles.hudItemText}>
                {formatTime(timeLeftMs)}
              </Text>
            </View>
            <Text style={styles.hudTitles}>Apartments on fire </Text>
            <View style={styles.counter}>
              <Text style={styles.hudItemText}>
                {burningCount}/{locations.length}
              </Text>
            </View>

          </View>
          <View style={styles.controls}>
            <Pressable
              disabled={status !== 'playing'}
              onPressIn={() => setSpraying(true)}
              onPressOut={() => setSpraying(false)}
              pressRetentionOffset={{ top: 300, left: 300, right: 300, bottom: 300 }}
              hitSlop={8}
              style={[
                styles.sprayButton,
                spraying && styles.sprayButtonActive,
                status !== 'playing' && styles.sprayButtonDisabled,
              ]}
            >
              <Text style={styles.sprayButtonText}>SPRAY!</Text>
            </Pressable>
            <Text style={styles.hint}>Hold SPRAY! (or spacebar) to fire.</Text>
          </View>
        </View>

        <View style={styles.mapStage} onLayout={measureMapStage}>
            <View style={[styles.mapFrame, {width: mapWidth + MAP_BORDER_WIDTH * 2, height: mapHeight + MAP_BORDER_WIDTH * 2}]}>
              <View style={styles.mapSurface}>
                <Image source={apartments} style={styles.mapImage} resizeMode="contain" />

                <View style={styles.fireOverlayLayer}>
                  {locations.map((location) => {
                    const intensity = intensities[location.id] ?? 0;
                    return intensity > 0 ? (<FireSprite key={location.id} location={location} intensity={intensity} />) : null;})}
                </View>

                <View style={styles.artLayer}>
                  <ArtLayer
                    nozzle={nozzle}
                    landing={landing}
                    spraying={spraying}
                    elapsedMs={elapsedMs}
                    hitLocation={hitLocation}
                  />
                </View>

                {/* surface to capture aiming touches. */}
                <View style={styles.aimLayer} {...aimHandlers} />
              </View>

              {/*overlays / modals*/}
              {status !== 'playing' && (
                <View style={styles.overlay}>
                  <View style={styles.overlayCard}>
                    <Text style={styles.overlayTitle}>
                      {status === 'lost' && burningCount / locations.length >= GAME_CONFIG.loseAtBurningFraction
                        ? 'Too many fires!'
                        : OVERLAY_COPY[status].title}
                    </Text>
                    <Text style={styles.overlayBody}>
                      {status === 'ready' &&
                        `Keep fewer than ${Math.round(GAME_CONFIG.winBelowBurningFraction * 100)}% of apartments burning for ${formatTime(GAME_CONFIG.durationMs)}. Immediately loss at ${Math.round(GAME_CONFIG.loseAtBurningFraction * 100)}%.`}
                      {status === 'won' &&
                        `Victory, you kept the fires under control!`}
                      {status === 'lost' &&
                        (burningCount / locations.length >= GAME_CONFIG.loseAtBurningFraction
                          ? `Fire is out of control, ${burningCount} of ${locations.length} windows are burning.`
                          : `Time ran out with ${burningCount} of ${locations.length} windows burning.`)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={status === 'ready' || !onContinue ? start : onContinue}
                      style={({ pressed }) => [styles.overlayButton, pressed && styles.overlayButtonPressed]}
                    >
                      <Text style={styles.overlayButtonText}>
                        {status !== 'ready' && onContinue ? 'CONTINUE' : OVERLAY_COPY[status].button}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
        </View>
      </View>
    </View>
  );
}

//allow spacebar to function on web like holding the button on mobile
function useSpaceBarSpray(setSpraying: (spraying: boolean) => void) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    interface KeyLikeEvent {
      code?: string;
      key?: string;
      repeat?: boolean;
      preventDefault: () => void;
    }
    const target = globalThis as unknown as {
      addEventListener: (type: string, listener: (event: KeyLikeEvent) => void) => void;
      removeEventListener: (type: string, listener: (event: KeyLikeEvent) => void) => void;
    };
    const isSpace = (event: KeyLikeEvent) => event.code === 'Space' || event.key === ' ';

    const onKeyDown = (event: KeyLikeEvent) => {
      if (!isSpace(event)) return;
      event.preventDefault(); // stop other potential key actions
      if (!event.repeat) setSpraying(true);
    };
    const onKeyUp = (event: KeyLikeEvent) => {
      if (!isSpace(event)) return;
      event.preventDefault();
      setSpraying(false);
    };

    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    return () => {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      setSpraying(false);
    };
  }, [setSpraying]);
}

const OVERLAY_COPY = {
  ready: { title: 'Fire alert!', button: 'START' },
  playing: { title: '', button: '' },
  won: { title: 'You saved the day!', button: 'PLAY AGAIN' },
  lost: { title: "Mission failed!", button: 'TRY AGAIN' },
} as const;

function formatTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

//Fire overlay

//fire: shrinks towards the base of its box and fades as it is put out.
const FireSprite = memo(function FireSprite({location, intensity}: {
  location: FireLocation;
  intensity: number;
}) {
  const { scale: size, opacity } = getFireVisual(intensity);
  return (
    <Image
      source={fire}
      resizeMode="cover"
      style={[
        styles.fireLocation,
        {
          opacity,
          left: `${(location.x + (location.width * (1 - size)) / 2) * 100}%`,
          top: `${(location.y + location.height * (1 - size)) * 100}%`,
          width: `${location.width * size * 100}%`,
          height: `${location.height * size * 100}%`,
        },
      ]}
    />
  );
});


// Fire truck, hose, water, marker
interface ArtLayerProps {
  nozzle: Point;
  landing: Point;
  spraying: boolean;
  elapsedMs: number;
  hitLocation: FireLocation | null;
}

//all the drawings on top of the image, like the hose, water, fire truck
function ArtLayer({ nozzle, landing, spraying, elapsedMs, hitLocation }: ArtLayerProps) {
  const anchor = convertToImageUnits(HOSE_ANCHOR);
  const tip = convertToImageUnits(nozzle);
  const target = convertToImageUnits(landing);
  const dir = getAimDirection(nozzle);

  // Hose: curve from the engine to the back of the nozzle.
  const hoseEnd = { x: tip.x - dir.x * 16, y: tip.y - dir.y * 16 };
  const hoseLength = Math.hypot(hoseEnd.x - anchor.x, hoseEnd.y - anchor.y);
  const sag = Math.min(80, hoseLength * 0.2);
  const hosePath = `M ${anchor.x} ${anchor.y} Q ${(anchor.x + hoseEnd.x) / 2} ${(anchor.y + hoseEnd.y) / 2 + sag
    } ${hoseEnd.x} ${hoseEnd.y}`;

  // Water arc: from the nozzle to the landing point.
  const arcLength = Math.hypot(target.x - tip.x, target.y - tip.y);
  const arcLift = Math.min(220, arcLength * 0.35);
  const arcPath = `M ${tip.x} ${tip.y} Q ${(tip.x + target.x) / 2} ${(tip.y + target.y) / 2 - arcLift
    } ${target.x} ${target.y}`;

  const nozzleAngle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  const engineX = ENGINE_LAYOUT.x * IMAGE_UNITS.width;
  const engineY = ENGINE_LAYOUT.y * IMAGE_UNITS.height;
  const engineScale = (ENGINE_LAYOUT.width * IMAGE_UNITS.width) / ENGINE_ART.width;
  const beaconOn = Math.floor(elapsedMs / 280) % 2 === 0;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${IMAGE_UNITS.width} ${IMAGE_UNITS.height}`}
      style={StyleSheet.absoluteFill}
    >
      {/* Fire engine */}
      <G transform={`translate(${engineX}, ${engineY}) scale(${engineScale})`}>
        <FireEngineArt beaconOn={beaconOn} />
      </G>

      {/* Hose */}
      <Path d={hosePath} stroke="#5a1a1a" strokeWidth={11} strokeLinecap="round" fill="none" />
      <Path d={hosePath} stroke="#f2b632" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path
        d={hosePath}
        stroke="#fff3c4"
        strokeOpacity={0.6}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="22 14"
        fill="none"
      />

      {/* Water (or the aiming preview while not spraying) */}
      {spraying ? (
        <>
          <Path
            d={arcPath}
            stroke="#38bdf8"
            strokeOpacity={0.55}
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={arcPath}
            stroke="#e6f8ff"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="16 12"
            strokeDashoffset={-elapsedMs * 0.5}
            fill="none"
          />
        </>
      ) : (
        <>
          <Path
            d={arcPath}
            stroke="#0c2f4a"
            strokeOpacity={0.45}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray="3 12"
            fill="none"
          />
          <Path
            d={arcPath}
            stroke="#ffffff"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray="3 12"
            fill="none"
          />
        </>
      )}

      {/* Nozzle */}
      <G
        transform={`translate(${tip.x}, ${tip.y}) rotate(${nozzleAngle}) scale(1, ${dir.x < 0 ? -1 : 1})`}
      >
        <Rect x={-20} y={-5} width={22} height={10} rx={3} fill="#d9a441" stroke="#5c3d0c" strokeWidth={2} />
        <Polygon points="2,-5 17,-3 17,3 2,5" fill="#f5c542" stroke="#5c3d0c" strokeWidth={2} />
        <Rect x={-12} y={5} width={6} height={10} rx={2} fill="#7a1f1f" stroke="#3d0f0f" strokeWidth={1.5} />
      </G>
      {!spraying && (
        <Circle
          cx={tip.x}
          cy={tip.y}
          r={30}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.85}
          strokeWidth={3}
          strokeDasharray="6 7"
        />
      )}

      {/* Landing marker */}
      <G transform={`translate(${target.x}, ${target.y})`}>
        <LandingMarker />
        {spraying && <Splash elapsedMs={elapsedMs} />}
      </G>

      {/* Steam over the fire being hit */}
      {spraying && hitLocation && <Steam location={hitLocation} elapsedMs={elapsedMs} />}
    </Svg>
  );
}

function LandingMarker() {
  const ticks: [number, number, number, number][] = [
    [-36, 0, -20, 0],
    [20, 0, 36, 0],
    [0, -36, 0, -20],
    [0, 20, 0, 36],
  ];
  return (
    <>
      <Circle r={16} fill="#38bdf8" fillOpacity={0.2} stroke="#0c2f4a" strokeWidth={7} />
      {ticks.map(([x1, y1, x2, y2], i) => (
        <Line key={`d${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0c2f4a" strokeWidth={7} strokeLinecap="round" />
      ))}
      <Circle r={16} fill="none" stroke="#ffffff" strokeWidth={3} />
      {ticks.map(([x1, y1, x2, y2], i) => (
        <Line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
      ))}
    </>
  );
}

function Splash({ elapsedMs }: { elapsedMs: number }) {
  const drops = Array.from({ length: 7 }, (_, i) => {
    const angle = ((i * 360) / 7 + elapsedMs * 0.25) * (Math.PI / 180);
    const radius = 34 + 12 * Math.sin(elapsedMs / 90 + i * 1.7);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.7 };
  });
  return (
    <>
      <Circle r={28 + 6 * Math.sin(elapsedMs / 70)} fill="#bae6fd" fillOpacity={0.5} />
      {drops.map((drop, i) => (
        <Circle key={i} cx={drop.x} cy={drop.y} r={4.5} fill="#e6f8ff" stroke="#0c2f4a" strokeOpacity={0.4} strokeWidth={1.5} />
      ))}
    </>
  );
}

function Steam({ location, elapsedMs }: { location: FireLocation; elapsedMs: number }) {
  const centerX = (location.x + location.width / 2) * IMAGE_UNITS.width;
  const topY = location.y * IMAGE_UNITS.height;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const t = (elapsedMs / 900 + i / 3) % 1;
        return (
          <Circle
            key={i}
            cx={centerX + (i - 1) * 16 + Math.sin(t * 6 + i) * 6}
            cy={topY - t * 70}
            r={9 + t * 16}
            fill="#ffffff"
            fillOpacity={(1 - t) * 0.7}
          />
        );
      })}
    </>
  );
}

//Side view of the fire truck
function FireEngineArt({ beaconOn }: { beaconOn: boolean }) {
  const rungs = Array.from({ length: 10 }, (_, i) => 132 + i * 10);
  return (
    <>
      <Ellipse cx={122} cy={113} rx={116} ry={5} fill="#000000" fillOpacity={0.22} />

      {/* Ladder on the roof */}
      <Rect x={128} y={22} width={100} height={4} rx={1.5} fill="#cfd5df" />
      <Rect x={128} y={30} width={100} height={4} rx={1.5} fill="#cfd5df" />
      {rungs.map((x) => (
        <Rect key={x} x={x} y={22} width={2.5} height={12} fill="#a9b1c0" />
      ))}

      {/* Equipment body with roll-up shutters */}
      <Rect x={96} y={34} width={136} height={58} rx={5} fill="#d92d2d" />
      <Rect x={96} y={82} width={136} height={10} fill="#a61f1f" />
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Rect x={104 + i * 32} y={44} width={28} height={34} rx={2} fill="#cfd5df" stroke="#8f98a8" strokeWidth={1} />
          {[0, 1, 2, 3].map((j) => (
            <Line
              key={j}
              x1={104 + i * 32}
              x2={132 + i * 32}
              y1={52 + j * 8}
              y2={52 + j * 8}
              stroke="#9aa3b2"
              strokeWidth={1.5}
            />
          ))}
        </G>
      ))}

      {/* Cab */}
      <Path
        d="M14 92 L14 70 Q14 63 21 61 L42 56 L54 38 Q56 34 61 34 L100 34 L100 92 Z"
        fill="#d92d2d"
      />
      <Path d="M59 40 L94 40 L94 56 L47 56 Z" fill="#a5d8ff" stroke="#7a1a1a" strokeWidth={2} />
      <Path d="M62 42 L72 42 L64 54 L55 54 Z" fill="#ffffff" fillOpacity={0.35} />
      <Rect x={84} y={64} width={9} height={3} rx={1.5} fill="#f1f5f9" />
      <Rect x={96} y={34} width={4} height={58} fill="#b32424" />

      {/* Gold stripe, bumper, headlight */}
      <Rect x={14} y={79} width={218} height={3} fill="#ffd34d" />
      <Rect x={10} y={84} width={24} height={8} rx={2} fill="#4b5563" />
      <Rect x={13} y={67} width={7} height={9} rx={2} fill="#ffe08a" />

      {/* Beacon bar on the cab roof */}
      <Rect x={62} y={28} width={26} height={7} rx={2} fill="#2d3340" />
      <Rect x={64} y={26} width={10} height={6} rx={2} fill={beaconOn ? '#ff3b30' : '#7f1d1d'} />
      <Rect x={76} y={26} width={10} height={6} rx={2} fill={beaconOn ? '#1e3a8a' : '#4f8cff'} />

      {/* Wheels */}
      {[58, 188].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={92} r={21} fill="#1d1f2b" />
          <Circle cx={cx} cy={96} r={17} fill="#2b2e3b" />
          <Circle cx={cx} cy={96} r={9} fill="#c9ced8" />
          <Circle cx={cx} cy={96} r={3.5} fill="#6b7280" />
        </G>
      ))}

      {/* Hose coupling (the hose starts at ENGINE_ART.hoseX / hoseY) */}
      <Rect x={ENGINE_ART.hoseX - 6} y={ENGINE_ART.hoseY + 1} width={12} height={7} fill="#b8862b" />
      <Circle
        cx={ENGINE_ART.hoseX}
        cy={ENGINE_ART.hoseY}
        r={5}
        fill="#f5c542"
        stroke="#7a5a14"
        strokeWidth={2}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'column',
  },
  //titles
  textInformation: {
    width: '100%',
    paddingTop: scale(8),
    paddingBottom: spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 36,
    color: colors.signal,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.textOnInk,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  //main content
  body: {
    flexDirection: "row",
    width: "90%",
    flex: 1,
  },
  //left area
  west: {
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  //hud info
  hud: {
    flexDirection: 'column',
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  hudTitles: {
    fontFamily: 'Nunito_700Bold',
    fontSize: scale(9),
    textAlign: "center",
    color: colors.textOnInk,
    fontWeight: "bold",
    fontStyle: "italic",
    textDecorationLine: "underline"
  },
  timer: {
    width: SPRAY_BUTTON_SIZE,
    height: scale(25),
    borderRadius: scale(7),
    backgroundColor: "silver",
    justifyContent: 'center',

  },
  hudItemText: {
    textAlign: "center",
    fontWeight: "bold",
    fontStyle: "italic",
    fontSize: scale(15),
  },
  counter: {
    width: SPRAY_BUTTON_SIZE,
    height: scale(25),
    borderRadius: scale(7),
    backgroundColor: "silver",
    justifyContent: 'center',

  },
  //button + text
  controls: {
    justifyContent: "flex-end",
    alignItems: "center",
    marginVertical: scale(5),

  },
  sprayButton: {
    width: SPRAY_BUTTON_SIZE,
    height: SPRAY_BUTTON_SIZE,
    borderRadius: SPRAY_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a9df4',
  },
  sprayButtonActive: {
    backgroundColor: '#0b6fc2',
    transform: [{ scale: 0.95 }],
  },
  sprayButtonDisabled: {
    opacity: 0.45,
  },
  sprayButtonText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: scale(14),
    letterSpacing: scale(0.75),
    color: colors.textOnInk,
  },
  hint: {
    fontFamily: 'Nunito_700Bold',
    fontSize: scale(6),
    color: colors.textOnInk,
    opacity: 0.9,
    marginVertical: scale(2),
  },

  //center
  mapStage: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: scale(5),
  },
  mapFrame: {
    position: 'relative',
    borderWidth: MAP_BORDER_WIDTH,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.panel,
  },
  mapSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  fireOverlayLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  fireLocation: {
    position: 'absolute',
  },
  artLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  aimLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 14, 32, 0.55)',
  },
  overlayCard: {
    maxWidth: '80%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: scale(1.5),
    borderColor: colors.inkLine,
    backgroundColor: colors.panel,
    alignItems: 'center',
  },
  overlayTitle: {
    fontFamily: 'Bangers_400Regular',
    fontSize: scale(13),
    letterSpacing: scale(0.75),
    color: colors.signal,
    textAlign: 'center',
  },
  overlayBody: {
    fontFamily: 'Nunito_700Bold',
    fontSize: scale(6),
    color: colors.textOnInk,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  overlayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md * 2,
    borderRadius: scale(100),
    backgroundColor: colors.signal,
    borderWidth: scale(1.5),
    borderColor: colors.inkLine,
  },
  overlayButtonPressed: {
    opacity: 0.8,
  },
  overlayButtonText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: scale(8),
    letterSpacing: scale(0.5),
    color: colors.ink,
  },

});