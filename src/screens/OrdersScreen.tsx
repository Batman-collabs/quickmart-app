import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Order, OrderStage } from '../types';

interface OrdersScreenProps {
  onBrowseHome: () => void;
  onOpenCart: () => void;
}

const STAGES: { key: OrderStage; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      sub: 'Dark store received your order',
      icon: 'checkmark-circle',
    },
    {
      key: 'packing',
      label: 'Packing Your Items',
      sub: 'Quality check & hygienic sealing',
      icon: 'cube',
    },
    {
      key: 'out_for_delivery',
      label: 'Rider on the Way',
      sub: 'Zooming towards your location',
      icon: 'bicycle',
    },
    {
      key: 'arriving',
      label: 'Arriving Shortly',
      sub: 'Near your building gate',
      icon: 'navigate',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      sub: 'Handed over safely!',
      icon: 'bag-check',
    },
  ];

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onBrowseHome,
  onOpenCart,
}) => {
  const { settings, orders, addToCart, advanceOrderStage, cancelOrder } = useStore();

  const handleReorder = (order: Order) => {
    order.items.forEach(({ product, quantity }) => {
      for (let i = 0; i < quantity; i += 1) {
        addToCart(product);
      }
    });
    onOpenCart();
  };

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛵</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySub}>
          Place your first {settings.storeName} order to experience live {settings.deliveryEtaMins}-minute delivery tracking!
        </Text>
        <Pressable
          onPress={onBrowseHome}
          style={[styles.shopBtn, { backgroundColor: settings.primaryColor }]}
        >
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </Pressable>
      </View>
    );
  }

  const latest = orders[0];
  const isCancelled = latest.stage === 'cancelled';
  const canCancel = latest.stage === 'confirmed' || latest.stage === 'packing';
  const currentStageIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.key === latest.stage),
  );
  const progressPct = isCancelled
    ? 0
    : Math.round((currentStageIdx / (STAGES.length - 1)) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.liveCard}>
        <View style={styles.liveHeader}>
          <View>
            <Text style={styles.orderIdText}>
              Order #{latest.id} • {latest.paymentStatus === 'paid_verified' ? 'PAID' : 'COD'}
            </Text>
            <Text
              style={[
                styles.etaBig,
                { color: isCancelled ? COLORS.danger : settings.primaryColor },
              ]}
            >
              {isCancelled
                ? 'Order Cancelled'
                : latest.stage === 'delivered'
                ? 'Delivered 🎉'
                : `Arriving in ${formatTimer(latest.etaSecondsRemaining)}`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {canCancel && (
              <Pressable
                onPress={() => void cancelOrder(latest.id)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            )}
            {latest.stage !== 'delivered' && !isCancelled && (
              <Pressable
                onPress={() => void advanceOrderStage(latest.id)}
                style={styles.simBtn}
              >
                <Text style={styles.simBtnText}>Next Step ⏭</Text>
              </Pressable>
            )}
          </View>
        </View>

        {!isCancelled && (
          <>
            <View style={[styles.routeBox, { backgroundColor: settings.primaryColor }]}>
              <View style={styles.routeLabels}>
                <Text style={styles.routePin}>🏪 {settings.storeName} Hub</Text>
                <Text style={styles.routePin}>🏠 {latest.address.label}</Text>
              </View>
              <View style={styles.trackBarBg}>
                <View style={[styles.trackBarFill, { width: `${Math.max(12, progressPct)}%` }]} />
              </View>
              <Text style={styles.routeStatus}>
                {STAGES[currentStageIdx]?.label} — {STAGES[currentStageIdx]?.sub}
              </Text>
            </View>

            <View style={styles.stepsWrap}>
              {STAGES.map((stage, idx) => {
                const done = idx <= currentStageIdx;
                return (
                  <View key={stage.key} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepDot,
                        done ? styles.stepDotDone : styles.stepDotPending,
                      ]}
                    >
                      <Ionicons
                        name={stage.icon}
                        size={13}
                        color={done ? COLORS.white : COLORS.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepLabel, !done && { color: COLORS.textMuted }]}>
                        {stage.label}
                      </Text>
                      <Text style={styles.stepSub}>{stage.sub}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.riderCard}>
              <View style={styles.riderAvatar}>
                <Text style={{ fontSize: 22 }}>🛵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.riderName}>{latest.riderName}</Text>
                <Text style={styles.riderMeta}>
                  Delivery Partner • 4.9 ★ • {latest.riderPhone}
                </Text>
              </View>
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <Text style={styles.historyHeader}>Your Orders ({orders.length})</Text>
      {orders.map((order) => {
        const badgeBg =
          order.stage === 'delivered'
            ? COLORS.greenLight
            : order.stage === 'cancelled'
            ? '#FEE2E2'
            : COLORS.primaryLight;
        const badgeText =
          order.stage === 'delivered'
            ? COLORS.green
            : order.stage === 'cancelled'
            ? COLORS.danger
            : COLORS.primary;

        return (
          <View key={order.id} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <View>
                <Text style={styles.historyId}>#{order.id}</Text>
                <Text style={styles.historyMeta}>
                  {order.items.reduce((s, i) => s + i.quantity, 0)} items • ₹{order.grandTotal} •{' '}
                  {order.paymentMethod.split('•')[0].trim()}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
                <Text style={[styles.statusPillText, { color: badgeText }]}>
                  {order.stage === 'delivered'
                    ? 'DELIVERED'
                    : order.stage === 'cancelled'
                    ? 'CANCELLED'
                    : 'LIVE'}
                </Text>
              </View>
            </View>

            <Text style={styles.itemsPreview} numberOfLines={2}>
              {order.items
                .map((i) => `${i.product.emoji} ${i.product.name} ×${i.quantity}`)
                .join(', ')}
            </Text>

            <View style={styles.historyFooter}>
              <Text style={styles.savedNote}>Saved ₹{order.totalSavings}</Text>
              <Pressable onPress={() => handleReorder(order)} style={styles.reorderBtn}>
                <Ionicons name="refresh" size={14} color={COLORS.accent} />
                <Text style={styles.reorderText}>Reorder</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.bg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 19,
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
  shopBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  liveCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  etaBig: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  simBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  simBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  routeBox: {
    marginTop: 12,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    padding: 12,
  },
  routeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routePin: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  trackBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  trackBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 99,
  },
  routeStatus: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  stepsWrap: {
    marginTop: 14,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: COLORS.green,
  },
  stepDotPending: {
    backgroundColor: COLORS.surfaceMuted,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  riderCard: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  riderMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  verifiedChip: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '800',
  },
  historyHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsPreview: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  savedNote: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reorderText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
  },
});
