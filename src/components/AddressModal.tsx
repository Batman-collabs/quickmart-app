import React, { useState } from 'react';
import {
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
import { COLORS } from '../theme/colors';
import { Address } from '../types';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose }) => {
  const { addresses, selectedAddress, selectAddress, addAddress } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState<Address['label']>('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');

  const handleSave = async () => {
    if (!line1.trim() || !line2.trim()) return;
    await addAddress(label, line1, line2);
    setLine1('');
    setLine2('');
    setShowForm(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Delivery Location</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {addresses.map((addr) => {
              const isSelected = addr.id === selectedAddress.id;
              return (
                <Pressable
                  key={addr.id}
                  onPress={() => {
                    selectAddress(addr.id);
                    onClose();
                  }}
                  style={[styles.addrCard, isSelected && styles.addrCardActive]}
                >
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={
                        addr.label === 'Home'
                          ? 'home'
                          : addr.label === 'Work'
                          ? 'briefcase'
                          : 'location'
                      }
                      size={18}
                      color={isSelected ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.addrTop}>
                      <Text style={styles.addrLabel}>{addr.label}</Text>
                      <View style={styles.etaBadge}>
                        <Text style={styles.etaText}>⚡ {addr.etaMins} MINS</Text>
                      </View>
                    </View>
                    <Text style={styles.addrLine1}>{addr.line1}</Text>
                    <Text style={styles.addrLine2}>{addr.line2}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            })}

            {!showForm ? (
              <Pressable onPress={() => setShowForm(true)} style={styles.addToggle}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.accent} />
                <Text style={styles.addToggleText}>Add New Delivery Address</Text>
              </Pressable>
            ) : (
              <View style={styles.formBox}>
                <Text style={styles.formTitle}>New Address</Text>
                <View style={styles.labelRow}>
                  {(['Home', 'Work', 'Other'] as Address['label'][]).map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => setLabel(l)}
                      style={[styles.labelChip, label === l && styles.labelChipActive]}
                    >
                      <Text
                        style={[
                          styles.labelChipText,
                          label === l && { color: COLORS.white },
                        ]}
                      >
                        {l}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={line1}
                  onChangeText={setLine1}
                  placeholder="House / Flat / Building No."
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
                <TextInput
                  value={line2}
                  onChangeText={setLine2}
                  placeholder="Street, Landmark, City"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
                <View style={styles.formActions}>
                  <Pressable onPress={() => setShowForm(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleSave} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Save & Select</Text>
                  </Pressable>
                </View>
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
    backgroundColor: 'rgba(18, 12, 32, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontSize: 17,
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
  body: {
    padding: 16,
    gap: 10,
  },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addrCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addrLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  etaBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.green,
  },
  addrLine1: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  addrLine2: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.accent,
    borderRadius: 14,
    marginTop: 4,
  },
  addToggleText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  formBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
