import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS, SHADOWS } from '../theme/colors';

const EMOJI_CHOICES = ['🥭', '🍕', '🍫', '🧀', '🥤', '🧁', '🥦', '🍗', '🍪', '🧴'];

export const AdminScreen: React.FC = () => {
  const {
    user,
    dbConnected,
    categories,
    products,
    allOrders,
    loadAllOrders,
    createProduct,
    updateProduct,
    deleteProduct,
    advanceOrderStage,
  } = useStore();

  const [tab, setTab] = useState<'inventory' | 'orders'>('inventory');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('QuickMart');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'fruits-veg');
  const [unit, setUnit] = useState('500 g');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('25');
  const [emoji, setEmoji] = useState('🥭');
  const [isFlashDeal, setIsFlashDeal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadAllOrders();
    }
  }, [user?.role, loadAllOrders]);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.lockedWrap}>
        <Text style={{ fontSize: 46 }}>🔒</Text>
        <Text style={styles.lockedTitle}>Store Admin Access Only</Text>
        <Text style={styles.lockedSub}>
          Sign in with the Store Admin demo account from the profile menu to manage products & live orders.
        </Text>
      </View>
    );
  }

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim()) {
      setFeedback('Enter product name and selling price');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await createProduct({
        name: name.trim(),
        brand: brand.trim() || 'QuickMart',
        categoryId,
        unit: unit.trim() || '1 pc',
        price: Number(price),
        mrp: Number(mrp) || Number(price),
        stock: Number(stock) || 25,
        emoji,
        isFlashDeal,
        isBestseller: true,
      });
      setName('');
      setPrice('');
      setMrp('');
      setFeedback('Product saved to Postgres DB!');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.topTitle}>Store Manager Console</Text>
          <Text style={styles.topSub}>
            {dbConnected ? 'Connected to live Netlify Postgres DB' : 'Offline mode'}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{products.length} SKUs</Text>
        </View>
      </View>

      <View style={styles.tabSwitch}>
        <Pressable
          onPress={() => setTab('inventory')}
          style={[styles.tabBtn, tab === 'inventory' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'inventory' && styles.tabTextActive]}>
            Inventory ({products.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setTab('orders');
            void loadAllOrders();
          }}
          style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>
            Live Orders ({allOrders.length})
          </Text>
        </Pressable>
      </View>

      {tab === 'inventory' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>+ Add New Product to Live Store</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {EMOJI_CHOICES.map((em) => (
                  <Pressable
                    key={em}
                    onPress={() => setEmoji(em)}
                    style={[styles.emojiChip, emoji === em && styles.emojiChipActive]}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Product Name (e.g. Alphonso Mango)"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />

            <View style={styles.rowInputs}>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="Brand"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="Unit (500 g)"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            <View style={styles.rowInputs}>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="Price ₹"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={mrp}
                onChangeText={setMrp}
                placeholder="MRP ₹"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={stock}
                onChangeText={setStock}
                placeholder="Stock"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, { flex: 0.8 }]}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.catChip,
                      categoryId === cat.id && styles.catChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        categoryId === cat.id && { color: COLORS.white },
                      ]}
                    >
                      {cat.emoji} {cat.shortName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setIsFlashDeal((v) => !v)}
              style={styles.toggleRow}
            >
              <Ionicons
                name={isFlashDeal ? 'checkbox' : 'square-outline'}
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.toggleText}>Feature in Flash Deals</Text>
            </Pressable>

            {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

            <Pressable
              onPress={handleAddProduct}
              disabled={saving}
              style={styles.createBtn}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.createBtnText}>Save Product to Database</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Manage Inventory</Text>
          {products.map((p) => (
            <View key={p.id} style={styles.skuCard}>
              <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.skuName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.skuMeta}>
                  ₹{p.price} (MRP ₹{p.mrp}) • Stock: {p.stock}
                </Text>
              </View>
              <View style={styles.skuActions}>
                <Pressable
                  onPress={() => void updateProduct({ id: p.id, stock: p.stock + 5 })}
                  style={styles.miniBtn}
                >
                  <Text style={styles.miniBtnText}>+5</Text>
                </Pressable>
                <Pressable
                  onPress={() => void updateProduct({ id: p.id, isFlashDeal: !p.isFlashDeal })}
                  style={[styles.miniBtn, p.isFlashDeal && { backgroundColor: COLORS.goldLight }]}
                >
                  <Text style={styles.miniBtnText}>⚡</Text>
                </Pressable>
                <Pressable
                  onPress={() => void deleteProduct(p.id)}
                  style={[styles.miniBtn, { backgroundColor: '#FEE2E2' }]}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={{ gap: 10 }}>
          {allOrders.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.lockedSub}>No customer orders in database yet.</Text>
            </View>
          ) : (
            allOrders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.orderTop}>
                  <Text style={styles.skuName}>
                    #{order.id} • ₹{order.grandTotal}
                  </Text>
                  <View style={styles.stagePill}>
                    <Text style={styles.stageText}>{order.stage.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.skuMeta}>
                  {order.address.label} • {order.address.line1}
                </Text>
                <Text style={styles.skuMeta}>
                  {order.items.map((i) => `${i.product.emoji} ${i.product.name} ×${i.quantity}`).join(', ')}
                </Text>
                {order.stage !== 'delivered' && (
                  <Pressable
                    onPress={() => void advanceOrderStage(order.id)}
                    style={styles.advanceBtn}
                  >
                    <Text style={styles.advanceText}>Advance Delivery Stage ⏭</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 14,
    paddingBottom: 28,
    gap: 12,
  },
  lockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  lockedSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  topBanner: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  topSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  countPill: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  countText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  emojiChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.text,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  createBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  createBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  skuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skuName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  skuMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  skuActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBtn: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stagePill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  advanceBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  advanceText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
