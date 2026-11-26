import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS } from '../theme/colors';

interface HeaderBarProps {
  onPressAddress: () => void;
  onPressSearch: () => void;
  onPressProfile: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onPressAddress,
  onPressSearch,
  onPressProfile,
}) => {
  const { selectedAddress, user, dbConnected, settings } = useStore();

  return (
    <View style={[styles.container, { backgroundColor: settings.primaryColor }]}>
      <View style={styles.topRow}>
        <Pressable onPress={onPressAddress} style={styles.locationBtn}>
          <View style={styles.etaLine}>
            <View style={styles.boltPill}>
              <Text style={{ fontSize: 11 }}>{settings.logoEmoji}</Text>
              <Text style={styles.etaMinutes}>
                {settings.storeName} • {settings.deliveryEtaMins} mins
              </Text>
            </View>
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {selectedAddress.line1}, {selectedAddress.line2}
            </Text>
            <Ionicons name="chevron-down" size={15} color={COLORS.white} />
          </View>
        </Pressable>

        <Pressable onPress={onPressProfile} style={styles.profileBtn}>
          {user ? (
            <Text style={styles.avatarInitial}>
              {user.name.slice(0, 1).toUpperCase()}
            </Text>
          ) : (
            <Ionicons name="person-outline" size={20} color={COLORS.white} />
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: dbConnected ? '#34D399' : '#FBBF24' },
            ]}
          />
        </Pressable>
      </View>

      <Pressable onPress={onPressSearch} style={styles.searchPill}>
        <Ionicons name="search" size={18} color={COLORS.primary} />
        <Text style={styles.searchPlaceholder}>
          Search for "milk", "tomato", "maggi"...
        </Text>
        <View style={styles.micDivider} />
        <Ionicons name="sparkles" size={16} color={COLORS.accent} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationBtn: {
    flex: 1,
    marginRight: 12,
  },
  etaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  boltPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    gap: 3,
  },
  etaMinutes: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  addressText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    flexShrink: 1,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  micDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
  },
});
