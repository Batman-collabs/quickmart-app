import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  compact = false,
}) => {
  const { settings, getQuantity, addToCart, decrementFromCart, favorites, toggleFavorite } =
    useStore();
  const quantity = getQuantity(product.id);
  const isFav = favorites.includes(product.id);
  const discountPct =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const outOfStock = product.stock <= 0;

  return (
    <Pressable
      onPress={() => onPress(product)}
      style={({ pressed }) => [
        styles.card,
        !compact && styles.cardFull,
        compact && styles.cardCompact,
        pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[styles.imageBox, { backgroundColor: product.cardBg }]}>
        {discountPct >= 5 && (
          <View style={[styles.discountBadge, { backgroundColor: settings.primaryColor }]}>
            <Text style={styles.discountText}>{discountPct}% OFF</Text>
          </View>
        )}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          style={styles.favBtn}
          hitSlop={8}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? settings.accentColor : COLORS.textSecondary}
          />
        </Pressable>

        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImg}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.emoji}>{product.emoji}</Text>
        )}

        <View style={styles.etaChip}>
          <Ionicons name="flash" size={10} color={COLORS.green} />
          <Text style={styles.etaText}>{product.deliveryMins} MINS</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.unit}>{product.unit}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color={COLORS.gold} />
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.brandText} numberOfLines={1}>
            • {product.brand}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.mrp > product.price && (
              <Text style={styles.mrp}>₹{product.mrp}</Text>
            )}
          </View>

          {outOfStock ? (
            <View style={styles.outBadge}>
              <Text style={styles.outText}>SOLD OUT</Text>
            </View>
          ) : quantity === 0 ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              style={[styles.addBtn, { borderColor: settings.accentColor }]}
            >
              <Text style={[styles.addBtnText, { color: settings.accentColor }]}>ADD</Text>
            </Pressable>
          ) : (
            <View style={[styles.stepper, { backgroundColor: settings.accentColor }]}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  decrementFromCart(product.id);
                }}
                style={styles.stepperBtn}
                hitSlop={6}
              >
                <Text style={styles.stepperSign}>−</Text>
              </Pressable>
              <Text style={styles.stepperQty}>{quantity}</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                style={styles.stepperBtn}
                hitSlop={6}
              >
                <Text style={styles.stepperSign}>+</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardFull: {
    flex: 1,
  },
  cardCompact: {
    width: 152,
    flexShrink: 0,
    marginRight: 12,
  },
  imageBox: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    padding: 5,
  },
  emoji: {
    fontSize: 46,
  },
  etaChip: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  etaText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.green,
  },
  body: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  unit: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
    minHeight: 34,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  brandText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  mrp: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  outBadge: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  outText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 6,
  },
  stepperBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  stepperQty: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center',
  },
});
