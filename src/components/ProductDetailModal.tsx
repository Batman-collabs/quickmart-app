import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS } from '../theme/colors';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectProduct,
}) => {
  const { products, getQuantity, addToCart, decrementFromCart, favorites, toggleFavorite } =
    useStore();

  if (!product) return null;

  const quantity = getQuantity(product.id);
  const isFav = favorites.includes(product.id);
  const discountPct =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const similar = products.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id,
  ).slice(0, 4);

  return (
    <Modal visible={Boolean(product)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose} style={styles.circleBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
            <Pressable onPress={() => toggleFavorite(product.id)} style={styles.circleBtn}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={20}
                color={isFav ? COLORS.accent : COLORS.text}
              />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <View style={[styles.heroBox, { backgroundColor: product.cardBg }]}>
              <Text style={styles.heroEmoji}>{product.emoji}</Text>
              <View style={styles.heroBadges}>
                <View style={styles.etaBadge}>
                  <Ionicons name="flash" size={12} color={COLORS.green} />
                  <Text style={styles.etaText}>{product.deliveryMins} MINS</Text>
                </View>
                {discountPct > 0 && (
                  <View style={styles.offBadge}>
                    <Text style={styles.offText}>{discountPct}% OFF</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.title}>{product.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.unit}>{product.unit}</Text>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color={COLORS.gold} />
                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.price}</Text>
              {product.mrp > product.price && (
                <>
                  <Text style={styles.mrp}>₹{product.mrp}</Text>
                  <Text style={styles.saveTag}>Save ₹{product.mrp - product.price}</Text>
                </>
              )}
            </View>

            <Text style={styles.sectionTitle}>Key Highlights</Text>
            <View style={styles.highlightsWrap}>
              {product.highlights.map((h) => (
                <View key={h} style={styles.highlightChip}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>About Product</Text>
            <Text style={styles.description}>{product.description}</Text>

            {similar.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Similar Items</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {similar.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => onSelectProduct(item)}
                      style={styles.similarCard}
                    >
                      <View style={[styles.similarImg, { backgroundColor: item.cardBg }]}>
                        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                      </View>
                      <Text style={styles.similarName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.similarPrice}>₹{item.price}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerUnit}>{product.unit}</Text>
              <Text style={styles.footerPrice}>₹{product.price}</Text>
            </View>

            {quantity === 0 ? (
              <Pressable onPress={() => addToCart(product)} style={styles.addCta}>
                <Text style={styles.addCtaText}>Add to Cart</Text>
              </Pressable>
            ) : (
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => decrementFromCart(product.id)}
                  style={styles.stepperBtn}
                >
                  <Text style={styles.stepperSign}>−</Text>
                </Pressable>
                <Text style={styles.stepperQty}>{quantity}</Text>
                <Pressable onPress={() => addToCart(product)} style={styles.stepperBtn}>
                  <Text style={styles.stepperSign}>+</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 12, 32, 0.52)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroBox: {
    height: 170,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  heroEmoji: {
    fontSize: 74,
  },
  heroBadges: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 8,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  etaText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
  },
  offBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  mrp: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  saveTag: {
    backgroundColor: COLORS.greenLight,
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  highlightsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  similarCard: {
    width: 108,
    marginRight: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 8,
  },
  similarImg: {
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  similarName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    minHeight: 28,
  },
  similarPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
  },
  footerUnit: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  addCta: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCtaText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 16,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
  stepperQty: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
