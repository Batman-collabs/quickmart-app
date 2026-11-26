import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { COLORS, SHADOWS } from '../theme/colors';
import { Product } from '../types';

interface HomeScreenProps {
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenOrders: () => void;
  onOpenCart: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectCategory,
  onSelectProduct,
  onOpenOrders,
  onOpenCart,
}) => {
  const {
    categories,
    products,
    activeOrder,
    itemTotal,
    freeDeliveryThreshold,
    applyCoupon,
    appliedCoupon,
  } = useStore();

  const flashDeals = products.filter((p) => p.isFlashDeal);
  const bestsellers = products.filter((p) => p.isBestseller);
  const remainingForFreeDel = Math.max(0, freeDeliveryThreshold - itemTotal);

  const stageLabel: Record<string, string> = {
    confirmed: 'Order confirmed • Assigning partner',
    packing: 'Packing your items at dark store',
    out_for_delivery: 'Rider is on the way!',
    arriving: 'Rider arriving at your doorstep',
    delivered: 'Delivered',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Active Order Live Banner */}
      {activeOrder && activeOrder.stage !== 'delivered' && (
        <Pressable onPress={onOpenOrders} style={styles.liveOrderBanner}>
          <View style={styles.liveLeft}>
            <View style={styles.liveDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>
                ⚡ Arriving in {Math.max(1, Math.ceil(activeOrder.etaSecondsRemaining / 60))} mins
              </Text>
              <Text style={styles.liveSub} numberOfLines={1}>
                {stageLabel[activeOrder.stage]} • {activeOrder.riderName}
              </Text>
            </View>
          </View>
          <View style={styles.trackPill}>
            <Text style={styles.trackPillText}>Track</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </Pressable>
      )}

      {/* Free Delivery Progress Strip */}
      <View style={styles.freeDeliveryStrip}>
        <Ionicons
          name={remainingForFreeDel === 0 ? 'checkmark-circle' : 'bicycle-outline'}
          size={18}
          color={COLORS.green}
        />
        <Text style={styles.freeDeliveryText}>
          {remainingForFreeDel === 0
            ? 'Yay! You unlocked FREE Express Delivery 🎉'
            : `Add items worth ₹${remainingForFreeDel} more for FREE delivery`}
        </Text>
      </View>

      {/* Hero Promo Banner */}
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>QUICKMART SUPER SAVER</Text>
          </View>
          <Text style={styles.heroTitle}>Flat ₹50 OFF on Fresh Groceries</Text>
          <Text style={styles.heroSubtitle}>
            Delivered to your doorstep in 8 minutes flat
          </Text>
          <Pressable
            onPress={() => {
              const res = applyCoupon('ZEPTO50');
              if (!res.ok) onOpenCart();
            }}
            style={styles.heroCta}
          >
            <Text style={styles.heroCtaText}>
              {appliedCoupon?.code === 'ZEPTO50' ? 'ZEPTO50 APPLIED ✓' : 'USE CODE: ZEPTO50'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.heroEmoji}>🛍️</Text>
      </View>

      {/* Flash Deals Horizontal Rail */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>⚡ Flash Deals</Text>
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>UP TO 30% OFF</Text>
          </View>
        </View>
        <Pressable onPress={() => categories[0] && onSelectCategory(categories[0].id)}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalList}
      >
        {flashDeals.map((item) => (
          <ProductCard
            key={item.id}
            product={item}
            onPress={onSelectProduct}
            compact
          />
        ))}
      </ScrollView>

      {/* Shop By Category Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelectCategory(cat.id)}
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.categoryEmojiBox, { backgroundColor: cat.bgColor }]}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            </View>
            <Text style={styles.categoryName} numberOfLines={2}>
              {cat.shortName}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bestsellers 2-Column Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Bestsellers Near You</Text>
        <Pressable onPress={() => (categories[1] ?? categories[0]) && onSelectCategory((categories[1] ?? categories[0]).id)}>
          <Text style={styles.seeAll}>Explore</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {bestsellers.map((item) => (
          <View key={item.id} style={styles.gridItem}>
            <ProductCard product={item} onPress={onSelectProduct} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: 24,
  },
  liveOrderBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
  },
  liveTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  liveSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  trackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 2,
  },
  trackPillText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  freeDeliveryStrip: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.greenLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBEBD0',
  },
  freeDeliveryText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#5B1199',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroTagText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12,
    marginTop: 4,
  },
  heroCta: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroCtaText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  heroEmoji: {
    fontSize: 56,
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  hotBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hotBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  seeAll: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '23.5%',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryEmojiBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
    marginBottom: 12,
  },
});
