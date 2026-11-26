import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider, useStore } from './src/context/StoreContext';
import { HeaderBar } from './src/components/HeaderBar';
import { FloatingCartBar } from './src/components/FloatingCartBar';
import { ProductDetailModal } from './src/components/ProductDetailModal';
import { AddressModal } from './src/components/AddressModal';
import { CartModal } from './src/components/CartModal';
import { AuthModal } from './src/components/AuthModal';
import { LegalDocKey, LegalModal } from './src/components/LegalModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { COLORS } from './src/theme/colors';
import { Product, TabRoute } from './src/types';

function QuickMartShell() {
  const { user, settings, categories, orders } = useStore();
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id ?? 'fruits-veg',
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalDocKey | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const openCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setActiveTab('categories');
  };

  const activeOrderCount = orders.filter(
    (o) => o.stage !== 'delivered' && o.stage !== 'cancelled',
  ).length;

  const tabs: {
    key: TabRoute;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconOutline: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'home', label: settings.storeName, icon: 'home', iconOutline: 'home-outline' },
    { key: 'categories', label: 'Categories', icon: 'grid', iconOutline: 'grid-outline' },
    { key: 'search', label: 'Search', icon: 'search', iconOutline: 'search-outline' },
    { key: 'orders', label: 'Orders', icon: 'receipt', iconOutline: 'receipt-outline' },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'admin' as TabRoute,
            label: 'Admin',
            icon: 'storefront' as const,
            iconOutline: 'storefront-outline' as const,
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.phoneFrame}>
        {activeTab !== 'search' && (
          <HeaderBar
            onPressAddress={() => setAddressModalOpen(true)}
            onPressSearch={() => setActiveTab('search')}
            onPressProfile={() => setAuthModalOpen(true)}
          />
        )}

        <View style={styles.screenArea}>
          {activeTab === 'home' && (
            <HomeScreen
              onSelectCategory={openCategory}
              onSelectProduct={setSelectedProduct}
              onOpenOrders={() => setActiveTab('orders')}
              onOpenCart={() => setCartModalOpen(true)}
              onOpenLegal={(doc) => setLegalTab(doc)}
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
          {activeTab === 'admin' && <AdminScreen />}
        </View>

        {activeTab !== 'admin' && (
          <FloatingCartBar onPress={() => setCartModalOpen(true)} />
        )}

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
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
                    color={active ? settings.primaryColor : COLORS.textMuted}
                  />
                  {tab.key === 'orders' && activeOrderCount > 0 && (
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeText}>{activeOrderCount}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    active && { color: settings.primaryColor, fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
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
          onRequireAuth={() => setAuthModalOpen(true)}
          onOrderPlaced={() => setActiveTab('orders')}
        />

        <AuthModal
          visible={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onOpenAdmin={() => setActiveTab('admin')}
          onOpenLegal={() => setLegalTab('contact')}
        />

        <LegalModal
          visible={Boolean(legalTab)}
          initialTab={legalTab ?? 'contact'}
          onClose={() => setLegalTab(null)}
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
