import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

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

  const p1 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p3 = polarToCartesian(cx, cy, rInner, startAngle);
  const p4 = polarToCartesian(cx, cy, rInner, endAngle);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
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
}) => {
  const SEGMENTS = 8;
  const segAngle = 360 / SEGMENTS; // 45°
  const radius = size / 2;
  const innerRadius = radius * 0.58; // donut thickness

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
      const start = i * segAngle;
      const end = start + segAngle;
      const fill = i % 2 === 0 ? '#ffffff' : '#E8EDF6';
      arr.push({
        path: donutSlicePath(
          radius,
          radius,
          radius - 4,
          innerRadius,
          start,
          end,
        ),
        fill,
      });
    }
    return arr;
  }, [innerRadius, radius, segAngle]);

  // Icon positions (midpoint of each slice)
  const iconPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const r = (radius + innerRadius) / 2; // mid radius
    for (let i = 0; i < 8; i++) {
      const midAngle = i * segAngle + segAngle / 2;
      const p = polarToCartesian(radius, radius, r, midAngle);
      positions.push(p);
    }
    return positions;
  }, [radius, innerRadius, segAngle]);

  return (
    <View style={[styles.container, { width: size, height: size + 70 }]}>
      {/* Pointer */}
      <View style={styles.pointer} />

      {/* Wheel */}
      <AnimatedView
        style={[styles.wheel, { width: size, height: size }, wheelStyle]}
      >
        <Svg width={size} height={size}>
          <G>
            {/* background */}
            <Circle cx={radius} cy={radius} r={radius - 2} fill="#F6F8FD" />
            {/* slices */}
            {slices.map((s, i) => (
              <Path key={`slice-${i}`} d={s.path} fill={s.fill} />
            ))}
            {/* center hub */}
            <Circle
              cx={radius}
              cy={radius}
              r={innerRadius * 0.55}
              fill="#fff"
              stroke="#E2E8F4"
            />
          </G>
        </Svg>
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
  pointer: {
    position: 'absolute',
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF6A4A',
    zIndex: 20,
  },
  iconWrap: {
    position: 'absolute',
  },
  iconText: {
    fontSize: 18,
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
});
