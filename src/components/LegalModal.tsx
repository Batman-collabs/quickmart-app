import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { COLORS } from '../theme/colors';

export type LegalDocKey = 'terms' | 'privacy' | 'refund' | 'contact';

interface LegalModalProps {
  visible: boolean;
  initialTab?: LegalDocKey;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  initialTab = 'contact',
  onClose,
}) => {
  const { settings } = useStore();
  const [tab, setTab] = useState<LegalDocKey>(initialTab);

  useEffect(() => {
    if (visible) setTab(initialTab);
  }, [initialTab, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{settings.storeName} • Policies & Support</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsBar}
            contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
          >
            {(
              [
                { key: 'contact', label: 'Contact & Store' },
                { key: 'terms', label: 'Terms' },
                { key: 'privacy', label: 'Privacy Policy' },
                { key: 'refund', label: 'Refunds & Cancel' },
              ] as { key: LegalDocKey; label: string }[]
            ).map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tabPill, tab === item.key && { backgroundColor: settings.primaryColor }]}
              >
                <Text style={[styles.tabText, tab === item.key && { color: COLORS.white }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {tab === 'contact' && (
              <View style={styles.card}>
                <Text style={styles.heading}>Store Contact Details</Text>
                <Text style={styles.para}>
                  <Text style={styles.bold}>Store Name:</Text> {settings.storeName} ({settings.tagline})
                </Text>
                <Text style={styles.para}>
                  <Text style={styles.bold}>Customer Support Phone:</Text> {settings.supportPhone}
                </Text>
                <Text style={styles.para}>
                  <Text style={styles.bold}>Support Email:</Text> {settings.supportEmail}
                </Text>
                <Text style={styles.para}>
                  <Text style={styles.bold}>Dispatch Address:</Text> {settings.storeAddress}
                </Text>
                <Text style={styles.para}>
                  <Text style={styles.bold}>Standard Delivery ETA:</Text> {settings.deliveryEtaMins} minutes
                </Text>
              </View>
            )}

            {tab === 'terms' && (
              <View style={styles.card}>
                <Text style={styles.heading}>Terms & Conditions</Text>
                <Text style={styles.para}>
                  1. All orders placed on {settings.storeName} are subject to real-time inventory availability at our local dark store.
                </Text>
                <Text style={styles.para}>
                  2. Express delivery ({settings.deliveryEtaMins} mins) depends on traffic, weather, and serviceable radius around {settings.storeAddress}.
                </Text>
                <Text style={styles.para}>
                  3. Prices displayed include applicable taxes. Delivery fee (₹{settings.deliveryFee}) is waived on orders above ₹{settings.freeDeliveryThreshold}.
                </Text>
                <Text style={styles.para}>
                  4. Promotional coupons are valid for active campaigns and minimum order values only.
                </Text>
              </View>
            )}

            {tab === 'privacy' && (
              <View style={styles.card}>
                <Text style={styles.heading}>Privacy Policy</Text>
                <Text style={styles.para}>
                  {settings.storeName} collects only your name, email, phone number, and delivery addresses to process and deliver orders accurately.
                </Text>
                <Text style={styles.para}>
                  Passwords are salted and hashed securely (PBKDF2 SHA-256). We never sell or rent customer contact details to third parties.
                </Text>
                <Text style={styles.para}>
                  For data deletion or privacy queries, contact {settings.supportEmail}.
                </Text>
              </View>
            )}

            {tab === 'refund' && (
              <View style={styles.card}>
                <Text style={styles.heading}>Refund & Cancellation Policy</Text>
                <Text style={styles.para}>
                  • Orders can be cancelled directly from the Orders tab while in "Confirmed" or "Packing" stage for an instant 100% refund / restock.
                </Text>
                <Text style={styles.para}>
                  • Once the rider is out for delivery, cancellations are handled via support ({settings.supportPhone}).
                </Text>
                <Text style={styles.para}>
                  • Damaged, expired, or missing items reported within 24 hours are eligible for instant replacement or full refund to the original payment method within 3–5 business days.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 12, 32, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    maxHeight: 48,
    paddingVertical: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  body: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  para: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  bold: {
    fontWeight: '800',
    color: COLORS.text,
  },
});
