import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from './src/data/catalog';
import { StoreProvider, useStore } from './src/context/StoreContext';
import { HeaderBar } from './src/components/HeaderBar';
import { FloatingCartBar } from './src/components/FloatingCartBar';
import { ProductDetailModal } from './src/components/ProductDetailModal';
import { AddressModal } from './src/components/AddressModal';
import { CartModal } from './src/components/CartModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { COLORS } from './src/theme/colors';
import { Product, TabRoute } from './src/types';

function QuickMartShell() {
  const { orders } = useStore();
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES[0].id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const openCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setActiveTab('categories');
  };

  const activeOrderCount = orders.filter((o) => o.stage !== 'delivered').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.phoneFrame}>
        {activeTab !== 'search' && (
          <HeaderBar
            onPressAddress={() => setAddressModalOpen(true)}
            onPressSearch={() => setActiveTab('search')}
            onPressOrders={() => setActiveTab('orders')}
          />
        )}

        <View style={styles.screenArea}>
          {activeTab === 'home' && (
            <HomeScreen
              onSelectCategory={openCategory}
              onSelectProduct={setSelectedProduct}
              onOpenOrders={() => setActiveTab('orders')}
              onOpenCart={() => setCartModalOpen(true)}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesScreen
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onSelectProduct={setSelectedProduct}
            />
          )}
          {activeTab === 'search' && (
            <SearchScreen onSelectProduct={setSelectedProduct} />
          )}
          {activeTab === 'orders' && (
            <OrdersScreen
              onBrowseHome={() => setActiveTab('home')}
              onOpenCart={() => setCartModalOpen(true)}
            />
          )}
        </View>

        <FloatingCartBar onPress={() => setCartModalOpen(true)} />

        {/* Bottom Navigation Bar */}
        <View style={styles.tabBar}>
          {(
            [
              { key: 'home', label: 'QuickMart', icon: 'home', iconOutline: 'home-outline' },
              { key: 'categories', label: 'Categories', icon: 'grid', iconOutline: 'grid-outline' },
              { key: 'search', label: 'Search', icon: 'search', iconOutline: 'search-outline' },
              { key: 'orders', label: 'Orders', icon: 'receipt', iconOutline: 'receipt-outline' },
            ] as {
              key: TabRoute;
              label: string;
              icon: keyof typeof Ionicons.glyphMap;
              iconOutline: keyof typeof Ionicons.glyphMap;
            }[]
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabItem}
              >
                <View style={{ position: 'relative' }}>
                  <Ionicons
                    name={active ? tab.icon : tab.iconOutline}
                    size={22}
                    color={active ? COLORS.primary : COLORS.textMuted}
                  />
                  {tab.key === 'orders' && activeOrderCount > 0 && (
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeText}>{activeOrderCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelectProduct={setSelectedProduct}
        />

        <AddressModal
          visible={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
        />

        <CartModal
          visible={cartModalOpen}
          onClose={() => setCartModalOpen(false)}
          onOpenAddress={() => {
            setCartModalOpen(false);
            setAddressModalOpen(true);
          }}
          onOrderPlaced={() => setActiveTab('orders')}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <QuickMartShell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#1E1533' : COLORS.primary,
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  screenArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  orderBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
});
