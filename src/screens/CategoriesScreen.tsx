import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, PRODUCTS } from '../data/catalog';
import { ProductCard } from '../components/ProductCard';
import { COLORS } from '../theme/colors';
import { Product } from '../types';

interface CategoriesScreenProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
}

type SortKey = 'popular' | 'price_low' | 'discount';

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  selectedCategoryId,
  onSelectCategory,
  onSelectProduct,
}) => {
  const [sortBy, setSortBy] = useState<SortKey>('popular');

  const activeCategory =
    CATEGORIES.find((c) => c.id === selectedCategoryId) ?? CATEGORIES[0];

  const items = useMemo(() => {
    const filtered = PRODUCTS.filter((p) => p.categoryId === activeCategory.id);
    if (sortBy === 'price_low') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'discount') {
      return [...filtered].sort(
        (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp,
      );
    }
    return filtered;
  }, [activeCategory.id, sortBy]);

  return (
    <View style={styles.container}>
      {/* Left Vertical Category Rail */}
      <ScrollView
        style={styles.rail}
        contentContainerStyle={styles.railContent}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              style={[styles.railItem, isActive && styles.railItemActive]}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <View style={[styles.railIconBox, { backgroundColor: cat.bgColor }]}>
                <Text style={styles.railEmoji}>{cat.emoji}</Text>
              </View>
              <Text
                style={[styles.railLabel, isActive && styles.railLabelActive]}
                numberOfLines={2}
              >
                {cat.shortName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Right Product Area */}
      <View style={styles.main}>
        <View style={[styles.banner, { backgroundColor: activeCategory.bgColor }]}>
          <Text style={styles.bannerEmoji}>{activeCategory.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{activeCategory.name}</Text>
            <Text style={styles.bannerSub}>
              {activeCategory.tagline} • {items.length} products
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortRow}
          contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}
        >
          {(
            [
              { key: 'popular', label: 'Popular' },
              { key: 'price_low', label: 'Price: Low to High' },
              { key: 'discount', label: 'Max Discount' },
            ] as { key: SortKey; label: string }[]
          ).map((chip) => {
            const active = sortBy === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setSortBy(chip.key)}
                style={[styles.sortChip, active && styles.sortChipActive]}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {items.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard product={product} onPress={onSelectProduct} />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
  },
  rail: {
    width: 84,
    flexGrow: 0,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  railContent: {
    paddingVertical: 8,
  },
  railItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    position: 'relative',
  },
  railItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: COLORS.primary,
  },
  railIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railEmoji: {
    fontSize: 24,
  },
  railLabel: {
    marginTop: 5,
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  railLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  main: {
    flex: 1,
  },
  banner: {
    margin: 10,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerEmoji: {
    fontSize: 28,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sortRow: {
    maxHeight: 40,
    marginBottom: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sortTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
    marginBottom: 10,
  },
});
