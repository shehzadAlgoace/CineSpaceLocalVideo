import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * LiquedGalas – Liquid Glass demo (v2)
 *  - Configurable texts & colors via props
 *  - Animated "sheen" sweep for premium glass feel
 *  - Better button hit areas & accessibility labels
 *  - Still no external blur dependency
 */

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 32, 640); // keep 16px gutters, cap at 640

export type LiquedGalasProps = {
  kicker?: string;
  title?: string;
  subtitle?: string;
  /** Background gradient behind the glass card */
  bgColors?: string[]; // 3–4 colors recommended
  /** Primary CTA */
  ctaPrimaryText?: string;
  onPrimary?: () => void;
  /** Secondary CTA */
  ctaSecondaryText?: string;
  onSecondary?: () => void;
  /** Primary button gradient */
  ctaPrimaryGradient?: string[]; // e.g. ['#6366F1','#22C55E','#EAB308']
};

export default function LiquedGalas({
  kicker = 'MAGIC GLACE',
  title = 'Liquid Glass UI',
  subtitle = 'Translucent layers, subtle borders, and soft gradients to mimic iOS 26 Liquid Glass—implemented in React Native.',
  bgColors = [
    'rgba(99,102,241,0.25)', // indigo-500 @ 25%
    'rgba(34,197,94,0.20)', // emerald-500 @ 20%
    'rgba(234,179,8,0.15)', // amber-500  @ 15%
  ],
  ctaPrimaryText = 'Try Demo',
  onPrimary,
  ctaSecondaryText = 'Learn More',
  onSecondary,
  ctaPrimaryGradient = ['#6366F1', '#22C55E', '#EAB308'],
}: LiquedGalasProps) {
  const edge = useMemo(() => Math.min(24, Math.round(width * 0.06)), []);

  // Animated sheen sweep across the glass card
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 4200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-0.35 * width, 0.35 * width],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {/* Background gradient (subtle, dreamy) */}
        <LinearGradient
          colors={bgColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glass Card */}
        <View style={[styles.glass, { borderRadius: edge, width: CARD_WIDTH }]}>
          {/* Soft highlight sheen */}
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Animated sweep overlay */}
          <Animated.View
            pointerEvents="none"
            style={[styles.sheenWrap, { transform: [{ translateX }] }]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheen}
            />
          </Animated.View>

          {/* Glass inner content */}
          <View style={styles.inner}>
            <Text style={styles.kicker} accessibilityRole="text">
              {kicker}
            </Text>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.sub}>{subtitle}</Text>

            {/* Quick stats pills */}
            <View style={styles.pillsRow}>
              <Pill label="Translucent" />
              <Pill label="Gradient" />
              <Pill
                label={
                  Platform.OS === 'ios' ? 'iOS-Optimized' : 'Android-Ready'
                }
              />
            </View>

            {/* CTA row */}
            <View style={styles.ctaRow}>
              <PrimaryButton
                text={ctaPrimaryText}
                onPress={onPrimary || (() => {})}
                gradient={ctaPrimaryGradient}
                accessibilityLabel={ctaPrimaryText}
              />
              <GhostButton
                text={ctaSecondaryText}
                onPress={onSecondary || (() => {})}
                accessibilityLabel={ctaSecondaryText}
              />
            </View>
          </View>

          {/* Edge accent rim (thin border illusion) */}
          <View
            style={[styles.rim, { borderRadius: edge }]}
            pointerEvents="none"
          />
        </View>

        {/* Bottom helper bar */}
        <View style={styles.helperBar}>
          <Text style={styles.helperText}>
            Tip: For true blur on iOS, swap the glass background with
            `@react-native-community/blur`.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ----------------------------- Sub‑components ---------------------------- */
function PrimaryButton({
  text,
  onPress,
  gradient,
  accessibilityLabel,
}: {
  text: string;
  onPress: () => void;
  gradient: string[];
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || text}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btnBg}
      >
        <Text style={styles.btnText}>{text}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function GhostButton({
  text,
  onPress,
  accessibilityLabel,
}: {
  text: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || text}
      style={({ pressed }) => [
        styles.btnGhost,
        pressed && styles.btnGhostPressed,
      ]}
    >
      <Text style={styles.btnGhostText}>{text}</Text>
    </Pressable>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <LinearGradient
        colors={['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.pillText}>{label}</Text>
      <View style={styles.pillRim} pointerEvents="none" />
    </View>
  );
}

/* --------------------------------- Styles -------------------------------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#0B0F14',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  glass: {
    // width: '100%', // removed, now set inline with CARD_WIDTH
    maxWidth: 780,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  inner: {
    padding: 24,
  },
  kicker: {
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  pill: {
    position: 'relative',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  pillRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  btn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
  },
  btnBg: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#0B0F14',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnGhost: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  btnGhostPressed: {
    transform: [{ scale: 0.98 }],
  },
  btnGhostText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helperBar: {
    marginTop: 18,
    paddingHorizontal: 12,
  },
  helperText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
  sheenWrap: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 160,
    opacity: 0.12,
  },
  sheen: {
    flex: 1,
  },
});
