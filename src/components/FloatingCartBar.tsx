import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS, SHADOWS } from '../theme/colors';

interface FloatingCartBarProps {
  onPress: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ onPress }) => {
  const { cart, cartCount, itemTotal, totalSavings } = useStore();

  if (cartCount === 0) return null;

  const previewEmojis = cart.slice(0, 3).map((c) => c.product.emoji);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.left}>
        <View style={styles.emojiStack}>
          {previewEmojis.map((emoji, idx) => (
            <View
              key={`${emoji}-${idx}`}
              style={[styles.emojiCircle, { marginLeft: idx === 0 ? 0 : -10 }]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </View>
          ))}
        </View>
        <View>
          <Text style={styles.summaryText}>
            {cartCount} {cartCount === 1 ? 'Item' : 'Items'} • ₹{itemTotal}
          </Text>
          {totalSavings > 0 ? (
            <Text style={styles.savingsText}>Saved ₹{totalSavings} on this order</Text>
          ) : (
            <Text style={styles.savingsText}>Superfast 8-min delivery</Text>
          )}
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>View Cart</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.green,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.floating,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emojiStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.green,
  },
  emoji: {
    fontSize: 16,
  },
  summaryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  savingsText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '600',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 2,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
