import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCTS, TRENDING_SEARCHES } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { COLORS } from '../theme/colors';
import { Product } from '../types';

interface SearchScreenProps {
  onSelectProduct: (product: Product) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectProduct }) => {
  const { favorites } = useStore();
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (onlyFavorites && !favorites.includes(p.id)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [query, onlyFavorites, favorites]);

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.inputBox}>
          <Ionicons name="search" size={18} color={COLORS.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search milk, bread, snacks, atta..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setOnlyFavorites((v) => !v)}
            style={[styles.favFilterChip, onlyFavorites && styles.favFilterChipActive]}
          >
            <Ionicons
              name={onlyFavorites ? 'heart' : 'heart-outline'}
              size={14}
              color={onlyFavorites ? COLORS.white : COLORS.accent}
            />
            <Text style={[styles.favFilterText, onlyFavorites && { color: COLORS.white }]}>
              Saved ({favorites.length})
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Trending Searches</Text>
        <View style={styles.chipsWrap}>
          {TRENDING_SEARCHES.map((term) => {
            const active = query.toLowerCase() === term.toLowerCase();
            return (
              <Pressable
                key={term}
                onPress={() => setQuery(active ? '' : term)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons
                  name="trending-up"
                  size={13}
                  color={active ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.chipText, active && { color: COLORS.white }]}>
                  {term}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.resultsHeader}>
          {results.length} {results.length === 1 ? 'Product' : 'Products'} Found
        </Text>

        {results.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No matching items found</Text>
            <Text style={styles.emptySub}>
              Try searching for "milk", "tomato", "coffee", or clear filters.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {results.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ProductCard product={item} onPress={onSelectProduct} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  content: {
    padding: 14,
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  favFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  favFilterChipActive: {
    backgroundColor: COLORS.accent,
  },
  favFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 99,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultsHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
    marginBottom: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
