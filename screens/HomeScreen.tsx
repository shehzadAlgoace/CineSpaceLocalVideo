import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  Image,
} from 'react-native';

/*
 ** Color tokens (cinematic theme)
 */
const COLORS = {
  primary: '#E43636', // red
  cream: '#F6EFD2',
  gold: '#E2DDB4',
  black: '#000000',
  white: '#FFFFFF',
};

/*
 ** Mock data (since there is no backend). Replace with real local queries later.
 */
const FEATURE_CARDS = [
  { key: 'all', title: 'All Videos', emoji: '🎥', count: 23 },
  { key: 'folders', title: 'Folders', emoji: '📁', count: 8 },
  { key: 'photos', title: 'Photos', emoji: '🖼️', count: 156 },
  { key: 'notes', title: 'Notes', emoji: '📝', count: 12 },
];

const FILTERS = ['All Videos', 'Folders', 'Photos', 'Notes'] as const;

type Filter = (typeof FILTERS)[number];

const RECENTS = [
  { id: 'r1', title: 'Action Movie Scene', duration: '12:34' },
  { id: 'r2', title: 'Documentary Film', duration: '8:45' },
  { id: 'r3', title: 'Classic Cinema', duration: '4:01' },
];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      android_ripple={{ color: '#ffffff20', borderless: false }}
    >
      <Text
        style={[
          styles.chipText,
          active ? styles.chipTextActive : styles.chipTextInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FeatureCard({
  title,
  emoji,
  count,
  onPress,
}: {
  title: string;
  emoji: string;
  count?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      android_ripple={{ color: '#00000010' }}
    >
      {!!count && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </Pressable>
  );
}

function RecentItem({ title, duration }: { title: string; duration: string }) {
  return (
    <View style={styles.recentItem}>
      {/* Thumbnail placeholder */}
      <View style={styles.thumbPlaceholder}>
        <Text style={styles.playIcon}>▶︎</Text>
        <View style={styles.durationPill}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.recentTitle}>
        {title}
      </Text>
    </View>
  );
}

const HomeScreen = () => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All Videos');

  const filteredCards = useMemo(() => {
    switch (activeFilter) {
      case 'Folders':
        return FEATURE_CARDS.filter(c => c.key === 'folders');
      case 'Photos':
        return FEATURE_CARDS.filter(c => c.key === 'photos');
      case 'Notes':
        return FEATURE_CARDS.filter(c => c.key === 'notes');
      default:
        return FEATURE_CARDS;
    }
  }, [activeFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.title}>CinePlay</Text>
            <Text style={styles.subtitle}>Your media. Your space.</Text>
          </View>
          <Pressable style={styles.settingsBtn} hitSlop={10}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            placeholder="Search videos..."
            placeholderTextColor="#00000090"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map(f => (
            <Chip
              key={f}
              label={f}
              active={activeFilter === f}
              onPress={() => setActiveFilter(f)}
            />
          ))}
        </ScrollView>

        {/* Feature grid */}
        <View style={styles.grid}>
          {filteredCards.map(card => (
            <FeatureCard
              key={card.key}
              title={card.title}
              emoji={card.emoji}
              count={card.count}
            />
          ))}
        </View>

        {/* Recently played */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.recentHeader}>Recently Played</Text>
          <View style={styles.divider} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentsRow}
        >
          {RECENTS.map(item => (
            <RecentItem
              key={item.id}
              title={item.title}
              duration={item.duration}
            />
          ))}
        </ScrollView>
      </ScrollView>

      {/* Floating Notes Button */}
      <Pressable style={styles.fab} android_ripple={{ color: '#ffffff30' }}>
        <Text style={styles.fabIcon}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.black },
  container: { padding: 16, paddingBottom: 40 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.cream,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.gold,
    fontSize: 12,
    marginTop: 4,
  },
  settingsBtn: { position: 'absolute', right: 0, top: 0, padding: 8 },
  settingsIcon: { fontSize: 18, color: COLORS.gold },

  /* Search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchIcon: { marginRight: 8, fontSize: 14 },
  searchInput: { flex: 1, color: COLORS.black, fontSize: 14 },

  /* Chips */
  chipsRow: { gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipInactive: { borderColor: COLORS.gold, backgroundColor: 'transparent' },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  chipText: { fontSize: 12 },
  chipTextInactive: { color: COLORS.gold },
  chipTextActive: { color: COLORS.cream },

  /* Cards grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  card: {
    width: '48%',
    height: 120,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardTitle: { color: COLORS.black, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  /* Recently played */
  recentHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  recentHeader: { color: COLORS.cream, fontWeight: '700', fontSize: 16 },
  divider: {
    height: 1,
    backgroundColor: COLORS.gold,
    flex: 1,
    marginLeft: 12,
    opacity: 0.7,
  },
  recentsRow: { gap: 12, paddingVertical: 12 },
  recentItem: { width: 140 },
  thumbPlaceholder: {
    height: 90,
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: COLORS.primary, fontSize: 22 },
  durationPill: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: { fontSize: 10, color: COLORS.black, fontWeight: '700' },
  recentTitle: { color: COLORS.cream, marginTop: 6, fontSize: 12 },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabIcon: { color: COLORS.white, fontSize: 26, lineHeight: 26, marginTop: -2 },
});
