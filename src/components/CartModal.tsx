import React, { useState } from 'react';
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
import { COUPONS } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { COLORS } from '../theme/colors';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAddress: () => void;
  onRequireAuth: () => void;
  onOrderPlaced: () => void;
}

const PAYMENT_OPTIONS = [
  'UPI • GPay / PhonePe',
  'Credit / Debit Card',
  'Cash on Delivery',
];

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  onOpenAddress,
  onRequireAuth,
  onOrderPlaced,
}) => {
  const {
    user,
    dbConnected,
    products,
    cart,
    itemTotal,
    deliveryFee,
    handlingFee,
    freeDeliveryThreshold,
    appliedCoupon,
    couponDiscount,
    grandTotal,
    totalSavings,
    selectedAddress,
    addToCart,
    decrementFromCart,
    applyCoupon,
    removeCoupon,
    placeOrder,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS[0]);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const quickAdds = products.filter((p) =>
    ['p6', 'p9', 'p10', 'p13'].includes(p.id),
  );

  const handleApplyCoupon = (code: string) => {
    const res = applyCoupon(code);
    setCouponFeedback({ ok: res.ok, msg: res.message });
    if (res.ok) setCouponInput('');
  };

  const handleCheckout = async () => {
    setOrderError(null);
    if (dbConnected && !user) {
      onClose();
      onRequireAuth();
      return;
    }
    setPlacing(true);
    try {
      const res = await placeOrder(paymentMethod);
      if (!res.ok) {
        if (res.error === 'AUTH_REQUIRED') {
          onClose();
          onRequireAuth();
          return;
        }
        setOrderError(res.error ?? 'Could not place order');
        return;
      }
      setCouponFeedback(null);
      onClose();
      onOrderPlaced();
    } finally {
      setPlacing(false);
    }
  };

  const remainingFreeDel = Math.max(0, freeDeliveryThreshold - itemTotal);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Text style={styles.headerSub}>
              ⚡ Delivery in {selectedAddress.etaMins} mins to {selectedAddress.label}
            </Text>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Your QuickMart cart is empty</Text>
            <Text style={styles.emptySub}>
              Add fresh groceries, snacks, or daily essentials for 8-minute delivery!
            </Text>
            <Pressable onPress={onClose} style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Browse Products</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Savings Banner */}
              {totalSavings > 0 && (
                <View style={styles.savingsBanner}>
                  <Ionicons name="pricetag" size={16} color={COLORS.green} />
                  <Text style={styles.savingsText}>
                    You are saving ₹{totalSavings} on this order!
                  </Text>
                </View>
              )}

              {remainingFreeDel > 0 && (
                <View style={styles.progressTip}>
                  <Text style={styles.progressTipText}>
                    Add ₹{remainingFreeDel} more to unlock FREE delivery (save ₹25)
                  </Text>
                </View>
              )}

              {/* Cart Items */}
              <View style={styles.card}>
                <View style={styles.etaCardHeader}>
                  <Ionicons name="flash" size={16} color={COLORS.green} />
                  <Text style={styles.etaCardTitle}>
                    Shipment in {selectedAddress.etaMins} minutes
                  </Text>
                </View>

                {cart.map(({ product, quantity }) => (
                  <View key={product.id} style={styles.cartRow}>
                    <View style={[styles.itemIcon, { backgroundColor: product.cardBg }]}>
                      <Text style={{ fontSize: 24 }}>{product.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.itemUnit}>{product.unit}</Text>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable
                        onPress={() => decrementFromCart(product.id)}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperSign}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperQty}>{quantity}</Text>
                      <Pressable
                        onPress={() => addToCart(product)}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperSign}>+</Text>
                      </Pressable>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.itemPrice}>₹{product.price * quantity}</Text>
                      {product.mrp > product.price && (
                        <Text style={styles.itemMrp}>₹{product.mrp * quantity}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Quick Add-ons */}
              <Text style={styles.blockLabel}>Forgot Something? Quick Add</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              >
                {quickAdds.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => addToCart(p)}
                    style={styles.quickAddCard}
                  >
                    <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                    <Text style={styles.quickAddName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <View style={styles.quickAddBottom}>
                      <Text style={styles.quickAddPrice}>₹{p.price}</Text>
                      <Text style={styles.quickAddPlus}>+ ADD</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Coupons */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Coupons & Offers</Text>
                {appliedCoupon ? (
                  <View style={styles.appliedCouponBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appliedCode}>
                        {appliedCoupon.code} Applied!
                      </Text>
                      <Text style={styles.appliedDesc}>
                        {appliedCoupon.title} • {appliedCoupon.description}
                      </Text>
                    </View>
                    <Pressable onPress={removeCoupon}>
                      <Text style={styles.removeCouponText}>Remove</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.couponInputRow}>
                      <TextInput
                        value={couponInput}
                        onChangeText={setCouponInput}
                        placeholder="Enter code (e.g. ZEPTO50)"
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.couponInput}
                        autoCapitalize="characters"
                      />
                      <Pressable
                        onPress={() => handleApplyCoupon(couponInput)}
                        style={styles.applyBtn}
                      >
                        <Text style={styles.applyBtnText}>APPLY</Text>
                      </Pressable>
                    </View>
                    {couponFeedback && (
                      <Text
                        style={[
                          styles.feedbackText,
                          { color: couponFeedback.ok ? COLORS.green : COLORS.danger },
                        ]}
                      >
                        {couponFeedback.msg}
                      </Text>
                    )}
                    <View style={styles.couponList}>
                      {COUPONS.map((c) => (
                        <Pressable
                          key={c.code}
                          onPress={() => handleApplyCoupon(c.code)}
                          style={styles.couponPill}
                        >
                          <Text style={styles.couponPillCode}>{c.code}</Text>
                          <Text style={styles.couponPillDesc}>{c.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Bill Summary */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bill Summary</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Total</Text>
                  <Text style={styles.billVal}>₹{itemTotal}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Handling Fee</Text>
                  <Text style={styles.billVal}>₹{handlingFee}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Partner Fee</Text>
                  <Text
                    style={[
                      styles.billVal,
                      deliveryFee === 0 && { color: COLORS.green, fontWeight: '800' },
                    ]}
                  >
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>
                {couponDiscount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: COLORS.green }]}>
                      Coupon Discount ({appliedCoupon?.code})
                    </Text>
                    <Text style={[styles.billVal, { color: COLORS.green }]}>
                      −₹{couponDiscount}
                    </Text>
                  </View>
                )}
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.grandLabel}>To Pay</Text>
                  <Text style={styles.grandVal}>₹{grandTotal}</Text>
                </View>
              </View>

              {/* Delivery Address */}
              <View style={styles.card}>
                <View style={styles.addrHeader}>
                  <Text style={styles.cardTitle}>Delivering To</Text>
                  <Pressable onPress={onOpenAddress}>
                    <Text style={styles.changeText}>Change</Text>
                  </Pressable>
                </View>
                <Text style={styles.addrLine}>
                  {selectedAddress.label} • {selectedAddress.line1}
                </Text>
                <Text style={styles.addrSub}>{selectedAddress.line2}</Text>
              </View>

              {/* Payment Method */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Method</Text>
                {PAYMENT_OPTIONS.map((opt) => {
                  const active = paymentMethod === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setPaymentMethod(opt)}
                      style={styles.payRow}
                    >
                      <Ionicons
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={active ? COLORS.primary : COLORS.textMuted}
                      />
                      <Text style={styles.payText}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {orderError && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 6, backgroundColor: COLORS.surface }}>
                <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '700' }}>
                  {orderError}
                </Text>
              </View>
            )}

            <View style={styles.checkoutBar}>
              <View>
                <Text style={styles.payTotal}>₹{grandTotal}</Text>
                <Text style={styles.payTotalSub}>
                  {dbConnected && !user ? 'SIGN IN TO CHECKOUT' : 'TOTAL PAYABLE'}
                </Text>
              </View>
              <Pressable
                onPress={handleCheckout}
                disabled={placing}
                style={[styles.checkoutBtn, placing && { opacity: 0.7 }]}
              >
                {placing ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.checkoutBtnText}>
                      {dbConnected && !user ? 'Sign In & Order' : 'Place Order'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.green,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  browseBtn: {
    marginTop: 18,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.greenLight,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBEBD0',
  },
  savingsText: {
    color: COLORS.green,
    fontWeight: '800',
    fontSize: 13,
  },
  progressTip: {
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 10,
  },
  progressTipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  etaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted,
  },
  etaCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 6,
  },
  stepperBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  stepperQty: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  priceCol: {
    alignItems: 'flex-end',
    minWidth: 46,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemMrp: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  blockLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickAddCard: {
    width: 118,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  quickAddName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickAddBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  quickAddPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickAddPlus: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: COLORS.text,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  applyBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  couponList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  couponPill: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  couponPillCode: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  couponPillDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  appliedCouponBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenLight,
    padding: 10,
    borderRadius: 10,
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.green,
  },
  appliedDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  removeCouponText: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  grandVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  addrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  addrLine: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  addrSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  payText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkoutBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payTotal: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },
  payTotalSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
