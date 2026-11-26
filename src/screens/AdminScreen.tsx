import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { Product } from '../types';

const EMOJI_CHOICES = ['🥭', '🍕', '🍫', '🧀', '🥤', '🧁', '🥦', '🍗', '🍪', '🧴'];
const THEME_COLORS = ['#4B0082', '#0F766E', '#1D4ED8', '#B91C1C', '#111827'];

type AdminTab = 'overview' | 'inventory' | 'orders' | 'branding';

export const AdminScreen: React.FC = () => {
  const {
    user,
    dbConnected,
    settings,
    coupons,
    categories,
    products,
    allOrders,
    adminStats,
    loadAllOrders,
    loadAdminStats,
    updateSettings,
    createCoupon,
    deleteCoupon,
    createProduct,
    updateProduct,
    deleteProduct,
    advanceOrderStage,
    cancelOrder,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');

  // Product Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('QuickMart');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'fruits-veg');
  const [unit, setUnit] = useState('500 g');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('25');
  const [imageUrl, setImageUrl] = useState('');
  const [emoji, setEmoji] = useState('🥭');
  const [isFlashDeal, setIsFlashDeal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit Product Modal State
  const [editing, setEditing] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Branding State
  const [bName, setBName] = useState(settings.storeName);
  const [bTagline, setBTagline] = useState(settings.tagline);
  const [bColor, setBColor] = useState(settings.primaryColor);
  const [bEta, setBEta] = useState(String(settings.deliveryEtaMins));
  const [bDelFee, setBDelFee] = useState(String(settings.deliveryFee));
  const [bFreeThresh, setBFreeThresh] = useState(String(settings.freeDeliveryThreshold));
  const [bHeroTitle, setBHeroTitle] = useState(settings.heroTitle);
  const [bPhone, setBPhone] = useState(settings.supportPhone);
  const [bEmail, setBEmail] = useState(settings.supportEmail);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);

  // Coupon State
  const [cCode, setCCode] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cMin, setCMin] = useState('199');
  const [cVal, setCVal] = useState('40');

  useEffect(() => {
    setBName(settings.storeName);
    setBTagline(settings.tagline);
    setBColor(settings.primaryColor);
    setBEta(String(settings.deliveryEtaMins));
    setBDelFee(String(settings.deliveryFee));
    setBFreeThresh(String(settings.freeDeliveryThreshold));
    setBHeroTitle(settings.heroTitle);
    setBPhone(settings.supportPhone);
    setBEmail(settings.supportEmail);
  }, [settings]);

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadAllOrders();
      void loadAdminStats();
    }
  }, [user?.role, loadAllOrders, loadAdminStats]);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.lockedWrap}>
        <Text style={{ fontSize: 46 }}>🔒</Text>
        <Text style={styles.lockedTitle}>Store Admin Access Only</Text>
        <Text style={styles.lockedSub}>
          Sign in with the Store Admin account to manage branding, inventory, coupons & orders.
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
        brand: brand.trim() || settings.storeName,
        categoryId,
        unit: unit.trim() || '1 pc',
        price: Number(price),
        mrp: Number(mrp) || Number(price),
        stock: Number(stock) || 25,
        imageUrl: imageUrl.trim(),
        emoji,
        isFlashDeal,
        isBestseller: true,
      });
      setName('');
      setPrice('');
      setMrp('');
      setImageUrl('');
      setFeedback('Product saved to Cloud DB!');
      void loadAdminStats();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditMrp(String(p.mrp));
    setEditStock(String(p.stock));
    setEditImageUrl(p.imageUrl ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateProduct({
        id: editing.id,
        name: editName.trim() || editing.name,
        price: Number(editPrice) || editing.price,
        mrp: Number(editMrp) || editing.mrp,
        stock: Number(editStock) || 0,
        imageUrl: editImageUrl.trim(),
      });
      setEditing(null);
      void loadAdminStats();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    setBrandMsg(null);
    try {
      await updateSettings({
        storeName: bName,
        tagline: bTagline,
        primaryColor: bColor,
        deliveryEtaMins: Number(bEta) || 8,
        deliveryFee: Number(bDelFee) || 0,
        freeDeliveryThreshold: Number(bFreeThresh) || 199,
        heroTitle: bHeroTitle,
        supportPhone: bPhone,
        supportEmail: bEmail,
      });
      setBrandMsg('White-label store settings saved!');
    } catch (err) {
      setBrandMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCoupon = async () => {
    if (!cCode.trim() || !cTitle.trim()) return;
    setSaving(true);
    try {
      await createCoupon({
        code: cCode.trim().toUpperCase(),
        title: cTitle.trim(),
        description: `Valid on orders above ₹${Number(cMin) || 99}`,
        minOrder: Number(cMin) || 99,
        type: 'flat',
        value: Number(cVal) || 25,
      });
      setCCode('');
      setCTitle('');
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
      <View style={[styles.topBanner, { backgroundColor: settings.primaryColor }]}>
        <View>
          <Text style={styles.topTitle}>{settings.storeName} Admin Console</Text>
          <Text style={styles.topSub}>
            {dbConnected ? 'Connected to live QuickMart Cloud DB' : 'Offline mode'}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{products.length} SKUs</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              { key: 'overview', label: 'Analytics' },
              { key: 'inventory', label: `Products (${products.length})` },
              { key: 'orders', label: `Orders (${allOrders.length})` },
              { key: 'branding', label: 'White-Label & Coupons' },
            ] as { key: AdminTab; label: string }[]
          ).map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  setTab(t.key);
                  if (t.key === 'orders') void loadAllOrders();
                  if (t.key === 'overview') void loadAdminStats();
                }}
                style={[
                  styles.tabChip,
                  active && { backgroundColor: settings.primaryColor, borderColor: settings.primaryColor },
                ]}
              >
                <Text style={[styles.tabText, active && { color: COLORS.white }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {tab === 'overview' && (
        <View style={{ gap: 10 }}>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
              <Text style={styles.kpiVal}>₹{adminStats?.totalRevenue ?? 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Orders</Text>
              <Text style={styles.kpiVal}>{adminStats?.totalOrders ?? allOrders.length}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Active Orders</Text>
              <Text style={[styles.kpiVal, { color: COLORS.green }]}>
                {adminStats?.activeOrders ?? 0}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Low Stock (≤10)</Text>
              <Text style={[styles.kpiVal, { color: COLORS.accent }]}>
                {adminStats?.lowStockCount ?? 0}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Commercial Readiness Checklist</Text>
            <Text style={styles.skuMeta}>
              ✓ Real Cloud SQL Database (D1) connected & seeded
            </Text>
            <Text style={styles.skuMeta}>
              ✓ White-Label Store Branding ({settings.storeName}) editable live
            </Text>
            <Text style={styles.skuMeta}>
              ✓ Dynamic Coupons ({coupons.length} active) & Legal Pages ready
            </Text>
            <Text style={styles.skuMeta}>
              ✓ Custom Domain & Razorpay/Cashfree ready via Cloudflare Dashboard
            </Text>
          </View>
        </View>
      )}

      {tab === 'inventory' && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>+ Add New Product</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
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

            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Optional Photo URL (https://...)"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
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

            <Pressable onPress={handleAddProduct} disabled={saving} style={styles.createBtn}>
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.createBtnText}>Save Product to Database</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Manage Inventory (Tap Edit to update price/photo)</Text>
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
                <Pressable onPress={() => openEdit(p)} style={styles.miniBtn}>
                  <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                </Pressable>
                <Pressable
                  onPress={() => void updateProduct({ id: p.id, stock: p.stock + 5 })}
                  style={styles.miniBtn}
                >
                  <Text style={styles.miniBtnText}>+5</Text>
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
      )}

      {tab === 'orders' && (
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
                  {order.items
                    .map((i) => `${i.product.emoji} ${i.product.name} ×${i.quantity}`)
                    .join(', ')}
                </Text>
                {order.stage !== 'delivered' && order.stage !== 'cancelled' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Pressable
                      onPress={() => void advanceOrderStage(order.id)}
                      style={[styles.advanceBtn, { flex: 1 }]}
                    >
                      <Text style={styles.advanceText}>Advance Stage ⏭</Text>
                    </Pressable>
                    {(order.stage === 'confirmed' || order.stage === 'packing') && (
                      <Pressable
                        onPress={() => void cancelOrder(order.id)}
                        style={[styles.advanceBtn, { backgroundColor: '#FEE2E2', paddingHorizontal: 14 }]}
                      >
                        <Text style={[styles.advanceText, { color: COLORS.danger }]}>Cancel</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'branding' && (
        <View style={{ gap: 12 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>White-Label Store Branding</Text>
            <TextInput
              value={bName}
              onChangeText={setBName}
              placeholder="Store Name"
              style={styles.input}
            />
            <TextInput
              value={bTagline}
              onChangeText={setBTagline}
              placeholder="Tagline"
              style={styles.input}
            />
            <TextInput
              value={bHeroTitle}
              onChangeText={setBHeroTitle}
              placeholder="Home Banner Headline"
              style={styles.input}
            />

            <Text style={styles.miniLabel}>Theme Color</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {THEME_COLORS.map((hex) => (
                <Pressable
                  key={hex}
                  onPress={() => setBColor(hex)}
                  style={[
                    styles.swatch,
                    { backgroundColor: hex },
                    bColor === hex && styles.swatchActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.rowInputs}>
              <TextInput
                value={bEta}
                onChangeText={setBEta}
                placeholder="ETA mins"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={bDelFee}
                onChangeText={setBDelFee}
                placeholder="Delivery ₹"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={bFreeThresh}
                onChangeText={setBFreeThresh}
                placeholder="Free Above ₹"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            <TextInput
              value={bPhone}
              onChangeText={setBPhone}
              placeholder="Support Phone"
              style={styles.input}
            />
            <TextInput
              value={bEmail}
              onChangeText={setBEmail}
              placeholder="Support Email"
              autoCapitalize="none"
              style={styles.input}
            />

            {brandMsg && <Text style={styles.feedbackText}>{brandMsg}</Text>}

            <Pressable onPress={handleSaveBranding} disabled={saving} style={styles.createBtn}>
              <Text style={styles.createBtnText}>Save Store Settings</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manage Promo Coupons</Text>
            <View style={styles.rowInputs}>
              <TextInput
                value={cCode}
                onChangeText={setCCode}
                placeholder="Code (e.g. SAVE40)"
                autoCapitalize="characters"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={cTitle}
                onChangeText={setCTitle}
                placeholder="Title (Flat ₹40 OFF)"
                style={[styles.input, { flex: 1.3 }]}
              />
            </View>
            <View style={styles.rowInputs}>
              <TextInput
                value={cMin}
                onChangeText={setCMin}
                placeholder="Min Order ₹"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={cVal}
                onChangeText={setCVal}
                placeholder="Discount ₹"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            <Pressable onPress={handleAddCoupon} disabled={saving} style={styles.advanceBtn}>
              <Text style={styles.advanceText}>+ Save Coupon</Text>
            </Pressable>

            {coupons.map((c) => (
              <View key={c.code} style={styles.couponRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.skuName}>
                    {c.code} • {c.title}
                  </Text>
                  <Text style={styles.skuMeta}>{c.description}</Text>
                </View>
                <Pressable onPress={() => void deleteCoupon(c.code)} style={styles.miniBtn}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Edit Product Modal */}
      <Modal visible={Boolean(editing)} animationType="fade" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Edit Product</Text>
            <TextInput value={editName} onChangeText={setEditName} placeholder="Name" style={styles.input} />
            <TextInput
              value={editImageUrl}
              onChangeText={setEditImageUrl}
              placeholder="Photo URL (https://...)"
              autoCapitalize="none"
              style={styles.input}
            />
            <View style={styles.rowInputs}>
              <TextInput
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder="Price ₹"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={editMrp}
                onChangeText={setEditMrp}
                placeholder="MRP ₹"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={editStock}
                onChangeText={setEditStock}
                placeholder="Stock"
                keyboardType="numeric"
                style={[styles.input, { flex: 0.8 }]}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <Pressable onPress={() => setEditing(null)} style={{ padding: 10 }}>
                <Text style={{ fontWeight: '700', color: COLORS.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveEdit} style={[styles.createBtn, { paddingHorizontal: 18 }]}>
                <Text style={styles.createBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  tabChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
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
  miniLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: COLORS.gold,
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
    fontSize: 14,
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
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 12, 32, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
});
