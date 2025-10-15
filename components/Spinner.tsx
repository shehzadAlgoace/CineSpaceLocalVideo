import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { Star } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// ====== Visual constants ======
const UI = {
  bg: '#FFFFFF',
  ring: '#F1F3F8',
  ringStroke: '#E5E9F1',
  sliceLight: '#EEF2F7',
  sliceDark: '#C8D0DB',
  centerStroke: '#E2E8F4',
  pointer: '#FF6A4A',
  dotOrange: '#FF734F',
  dotGray: '#B9C2CF',
  shadow: 'rgba(0,0,0,0.18)',
};

// ====== Types ======
export type SpinnerItem = {
  id: string;
  label?: string; // optional; when omitted this slice is treated as empty
  color?: string; // optional slice color
};

type Props = {
  size?: number; // outer diameter in px
  items?: (SpinnerItem | null)[]; // length must be 8 (4 items + 4 nulls)
  onStop?: (selectedIndex: number, item: SpinnerItem | null) => void;
  highlightIndex?: number | null; // slice to show as active/highlighted
  showCenterStar?: boolean; // toggle center star visibility
  tapered?: boolean; // draw slices as rounded triangle wedges
};

// ====== Helpers ======
const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) => {
  'worklet';
  const angle = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};

const donutSlicePath = (
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) => {
  // Large arc flag
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  // Slightly inset for rounded separation look
  const inset = (rOuter - rInner) * 0.05;
  const rOuterInset = rOuter - inset;
  const rInnerInset = rInner + inset;
  const p1 = polarToCartesian(cx, cy, rOuterInset, endAngle);
  const p2 = polarToCartesian(cx, cy, rOuterInset, startAngle);
  const p3 = polarToCartesian(cx, cy, rInnerInset, startAngle);
  const p4 = polarToCartesian(cx, cy, rInnerInset, endAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuterInset} ${rOuterInset} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInnerInset} ${rInnerInset} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
};

// Rim dots positions
const ringDotPositions = (cx: number, cy: number, r: number, count = 8) => {
  const pts: { x: number; y: number }[] = [];
  const step = 360 / count;
  for (let i = 0; i < count; i++) {
    const a = i * step; // 0..360
    const p = polarToCartesian(cx, cy, r, a);
    pts.push(p);
  }
  return pts;
};

// ====== Component ======
const AnimatedView = Animated.createAnimatedComponent(View);

const DEFAULT_ITEMS: (SpinnerItem | null)[] = [
  { id: '1', label: '🔑', color: '#F3F7FF' },
  null,
  { id: '2', label: '💰', color: '#EAF2FF' },
  null,
  { id: '3', label: '⚡️', color: '#F3F7FF' },
  null,
  { id: '4', label: '🔁', color: '#EAF2FF' },
  null,
];

const Spinner: React.FC<Props> = ({
  size = 260,
  items = DEFAULT_ITEMS,
  onStop,
  highlightIndex = null,
  showCenterStar = true,
  tapered = true,
}) => {
  const CORAL_PAD = 18; // thickness of the coral rim
  // Draws a triangle-like wedge with a rounded tip (for tapered spinner style)
  const roundedWedgePath = (
    cx: number,
    cy: number,
    rOuter: number,
    tipRadius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    // small rounded tip using a tiny arc around the center
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    const pStart = polarToCartesian(cx, cy, rOuter, startAngle);
    const pEnd = polarToCartesian(cx, cy, rOuter, endAngle);
    const mid = (startAngle + endAngle) / 2;
    const tipEps = Math.min(8, (endAngle - startAngle) / 3); // keep inside slice
    const tipRight = polarToCartesian(cx, cy, tipRadius, mid - tipEps / 2);
    const tipLeft = polarToCartesian(cx, cy, tipRadius, mid + tipEps / 2);
    return [
      `M ${pEnd.x} ${pEnd.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${pStart.x} ${pStart.y}`,
      `L ${tipRight.x} ${tipRight.y}`,
      `A ${tipRadius} ${tipRadius} 0 0 1 ${tipLeft.x} ${tipLeft.y}`,
      `L ${pEnd.x} ${pEnd.y}`,
      'Z',
    ].join(' ');
  };
  const SEGMENTS = 8;
  const segAngle = 360 / SEGMENTS; // 45°
  const radius = size / 2;
  const innerRadius = radius * 0.58; // donut thickness
  const gapDeg = 4; // tighter spacing between slices

  const data = useMemo(() => {
    if (items.length !== SEGMENTS) {
      const filled = [...items];
      while (filled.length < SEGMENTS) filled.push(null);
      return filled.slice(0, SEGMENTS);
    }
    return items;
  }, [items]);

  // rotation shared value (degrees)
  const rotation = useSharedValue(0);

  // Pointer is fixed at 0° (top). We rotate the wheel under it.
  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const spin = useCallback(() => {
    // choose a segment index to land on
    const targetIndex = Math.floor(Math.random() * SEGMENTS);

    // We want the CENTER of the targetIndex to align to the pointer (0°).
    // Current absolute angle modulo 360
    const current = ((rotation.value % 360) + 360) % 360;

    const targetCenterFromZero = targetIndex * segAngle + segAngle / 2; // (0..360)

    // We need to rotate negatively so that targetCenterFromZero ends at 0° under pointer
    // Compute shortest positive delta going backward plus extra full spins
    const baseDelta = current + targetCenterFromZero; // where the center is relative to current orientation
    const spins = 5; // full rotations for flair
    const toValue = rotation.value - baseDelta - spins * 360; // rotate CCW

    rotation.value = withTiming(
      toValue,
      { duration: 3200, easing: Easing.out(Easing.cubic) },
      finished => {
        if (finished) {
          // Report the intended landing index directly to avoid any rounding/offset drift
          onStop && runOnJS(onStop)(targetIndex, data[targetIndex]);
        }
      },
    );
  }, [data, onStop, rotation, segAngle]);

  const slices = useMemo(() => {
    const arr: { path: string; fill: string }[] = [];
    for (let i = 0; i < 8; i++) {
      const segStart = i * segAngle;
      const segEnd = segStart + segAngle;
      const start = segStart + gapDeg / 2;
      const end = segEnd - gapDeg / 2;
      const fill = i % 2 === 0 ? '#F1F2F3' : 'rgba(131, 145, 161, 1)';
      const path = tapered
        ? roundedWedgePath(
            radius,
            radius,
            radius - 6,
            Math.max(6, radius * 0.06),
            start,
            end,
          )
        : donutSlicePath(radius, radius, radius - 6, innerRadius, start, end);
      arr.push({ path, fill });
    }
    return arr;
  }, [innerRadius, radius, segAngle, tapered]);

  // Icon positions (midpoint of each slice)
  const iconPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const r = tapered ? radius * 0.64 : (radius + innerRadius) / 2;
    for (let i = 0; i < 8; i++) {
      const midAngle = i * segAngle + segAngle / 2;
      const p = polarToCartesian(radius, radius, r, midAngle);
      positions.push(p);
    }
    return positions;
  }, [radius, innerRadius, segAngle, tapered]);

  const dots = useMemo(
    () => ringDotPositions(radius, radius, radius * 0.965),
    [radius],
  );

  // Dots on the coral rim (non-rotating)
  const outerSize = size + CORAL_PAD * 2;
  const outerRadius = outerSize / 2;
  const coralDotTrackR = outerRadius - CORAL_PAD / 2; // center of coral band
  const coralDots = useMemo(
    () => ringDotPositions(outerRadius, outerRadius, coralDotTrackR, 9),
    [outerRadius, coralDotTrackR],
  );

  return (
    <View style={[styles.container, { width: size, height: size + 70 }]}>
      {/* Static outer ring with dots (does not rotate) */}

      {/* Pointer (circle + triangle) */}
      <View style={styles.pointerWrap}>
        <View style={styles.pointerHead}>
          <View style={styles.pointerInnerDot} />
        </View>
        <View style={styles.pointerTip} />
      </View>
      <View style={[styles.coralWrap, { padding: CORAL_PAD }]}>
        {/* Coral rim dots (static) */}
        <Svg
          width={outerSize}
          height={outerSize}
          style={styles.coralDots}
          pointerEvents="none"
        >
          <G>
            {coralDots.map((p, i) => (
              <Circle
                key={`cd-${i}`}
                cx={p.x}
                cy={p.y}
                r={Math.max(2, radius * 0.03)}
                fill={
                  [0, 2, 4, 6, 8].includes(i)
                    ? 'rgba(242, 117, 68, 1)'
                    : 'rgba(131, 145, 161, 1)'
                }
              />
            ))}
          </G>
        </Svg>
        {/* Wheel */}
        <AnimatedView
          style={[styles.wheel, { width: size, height: size }, wheelStyle]}
        >
          <Svg width={size} height={size}>
            <G>
              {/* drop shadow */}
              <Circle
                cx={radius}
                cy={radius}
                r={radius - 2}
                fill={'red'}
                opacity={0.24}
              />
              {/* outer rim (thicker) */}
              <Circle
                cx={radius}
                cy={radius}
                r={radius - 4}
                fill={'white'}
                stroke={'white'}
                strokeWidth={8}
              />
              {/* outer rim highlight */}
              <Circle
                cx={radius}
                cy={radius}
                r={radius - 10}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.9}
                strokeWidth={1.6}
              />
              {/* inner bowl background (white) */}
              <Circle
                cx={radius}
                cy={radius}
                r={radius * 0.84}
                fill={'white'}
              />
              {/* inner bowl subtle edge */}
              <Circle
                cx={radius}
                cy={radius}
                r={radius * 0.84}
                fill="none"
                stroke={'white'}
                strokeOpacity={0.6}
                strokeWidth={1}
              />
              {/* slices */}
              {slices.map((s, i) => (
                <G key={`slice-${i}`}>
                  <Path d={s.path} fill={s.fill} />

                  <Path
                    d={s.path}
                    fill="none"
                    stroke="white"
                    strokeWidth={Math.max(1, radius * 0.015)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.95}
                  />
                </G>
              ))}
              {/* highlighted wedge overlay */}
              {typeof highlightIndex === 'number' &&
                highlightIndex >= 0 &&
                (() => {
                  const segStart = highlightIndex * segAngle;
                  const segEnd = segStart + segAngle;
                  const start = segStart + gapDeg / 2;
                  const end = segEnd - gapDeg / 2;
                  const path = tapered
                    ? roundedWedgePath(
                        radius,
                        radius,
                        radius - 6,
                        Math.max(6, radius * 0.06),
                        start,
                        end,
                      )
                    : donutSlicePath(
                        radius,
                        radius,
                        radius - 6,
                        innerRadius,
                        start,
                        end,
                      );
                  return (
                    <G>
                      <Path d={path} fill="#748291" opacity={0.6} />
                      <Path
                        d={path}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth={Math.max(1, radius * 0.015)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.95}
                      />
                    </G>
                  );
                })()}
              {/* center hub */}
              <Circle
                cx={radius}
                cy={radius + 1.5}
                r={innerRadius * 0.45}
                fill={UI.shadow}
                opacity={0.18}
              />
              <Circle
                cx={radius}
                cy={radius}
                r={innerRadius * 0.45}
                fill={UI.bg}
                stroke={UI.centerStroke}
                strokeWidth={1.5}
              />

              {/* star moved to overlay using lucide icon */}
            </G>
          </Svg>
          {showCenterStar && (
            <Star
              style={{
                position: 'absolute',
                left: radius - innerRadius * 0.22,
                top: radius - innerRadius * 0.22,
              }}
              width={innerRadius * 0.44}
              height={innerRadius * 0.44}
              color={UI.pointer}
              fill={UI.pointer}
              strokeWidth={1.5}
            />
          )}
          {/* Emoji labels positioned over the SVG */}
          {data.map((it, i) => {
            if (!it?.label) return null;
            const p = iconPositions[i];
            return (
              <View
                key={`icon-${i}`}
                style={[styles.iconWrap, { left: p.x - 12, top: p.y - 12 }]}
              >
                <Text style={styles.iconText}>{it.label}</Text>
              </View>
            );
          })}
        </AnimatedView>
      </View>
      {/* Spin button */}
      <Pressable
        onPress={spin}
        style={styles.spinBtn}
        android_ripple={{ color: '#e0ecff' }}
      >
        <Text style={styles.spinTxt}>SPIN</Text>
      </Pressable>
    </View>
  );
};

export default Spinner;

// ====== Styles ======
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  wheel: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  pointerWrap: {
    position: 'absolute',
    top: 0,
    zIndex: 20,
    alignItems: 'center',
  },
  pointerHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: UI.pointer,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pointerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: UI.pointer,
    marginTop: -1,
  },
  iconWrap: {
    position: 'absolute',
  },
  iconText: {
    fontSize: 22,
  },
  spinBtn: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
  },
  spinTxt: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  pointerInnerDot: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  coralWrap: {
    backgroundColor: 'rgba(241, 242, 243, 1)',
    borderRadius: 1000,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralDots: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
