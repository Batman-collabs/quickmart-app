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
import { useStore } from '../context/StoreContext';
import { COLORS } from '../theme/colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
  onOpenLegal: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onOpenAdmin,
  onOpenLegal,
}) => {
  const { user, settings, dbConnected, login, register, logout } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, phone, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setBusy(true);
    try {
      await login(demoEmail, demoPass);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>{user ? 'Your Account' : `Sign In to ${settings.storeName}`}</Text>
              <View
                style={[
                  styles.dbBadge,
                  { backgroundColor: dbConnected ? COLORS.greenLight : COLORS.goldLight },
                ]}
              >
                <Text
                  style={[
                    styles.dbBadgeText,
                    { color: dbConnected ? COLORS.green : '#A16207' },
                  ]}
                >
                  {dbConnected ? '● Live DB' : '● Offline'}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {user ? (
              <View style={styles.profileWrap}>
                <View style={styles.profileCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.profileName}>{user.name}</Text>
                      <View style={styles.rolePill}>
                        <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.profileMeta}>{user.email}</Text>
                    {Boolean(user.phone) && (
                      <Text style={styles.profileMeta}>{user.phone}</Text>
                    )}
                  </View>
                </View>

                {user.role === 'admin' && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    style={styles.adminBtn}
                  >
                    <Ionicons name="storefront" size={18} color={COLORS.white} />
                    <Text style={styles.adminBtnText}>Open Store Admin Panel</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    onClose();
                    onOpenLegal();
                  }}
                  style={{ alignItems: 'center', paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
                    Terms, Privacy, Refund Policy & Store Support →
                  </Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    await logout();
                    onClose();
                  }}
                  style={styles.logoutBtn}
                >
                  <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
                  <Text style={styles.logoutText}>Sign Out</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.switchRow}>
                  <Pressable
                    onPress={() => {
                      setMode('login');
                      setError(null);
                    }}
                    style={[styles.switchTab, mode === 'login' && styles.switchTabActive]}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        mode === 'login' && styles.switchTextActive,
                      ]}
                    >
                      Login
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setMode('register');
                      setError(null);
                    }}
                    style={[styles.switchTab, mode === 'register' && styles.switchTabActive]}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        mode === 'register' && styles.switchTextActive,
                      ]}
                    >
                      Create Account
                    </Text>
                  </Pressable>
                </View>

                {mode === 'register' && (
                  <>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Full Name"
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.input}
                    />
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Phone Number (e.g. +91 98765 43210)"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </>
                )}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  style={styles.input}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  onPress={handleSubmit}
                  disabled={busy || !dbConnected}
                  style={[styles.submitBtn, (busy || !dbConnected) && { opacity: 0.65 }]}
                >
                  {busy ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitText}>
                      {mode === 'login' ? 'Sign In' : 'Create Real Account'}
                    </Text>
                  )}
                </Pressable>

                {!dbConnected && (
                  <Text style={styles.offlineNote}>
                    Database offline on local static server — open the deployed Netlify URL for live auth & DB.
                  </Text>
                )}

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerLabel}>1-TAP DEMO ACCOUNTS</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.demoRow}>
                  <Pressable
                    onPress={() => handleDemoLogin('aayush@quickmart.app', 'quick123')}
                    disabled={busy || !dbConnected}
                    style={styles.demoBtn}
                  >
                    <Text style={styles.demoTitle}>🛍️ Customer Demo</Text>
                    <Text style={styles.demoSub}>aayush@quickmart.app</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDemoLogin('admin@quickmart.app', 'admin123')}
                    disabled={busy || !dbConnected}
                    style={[styles.demoBtn, { borderColor: COLORS.primary }]}
                  >
                    <Text style={[styles.demoTitle, { color: COLORS.primary }]}>
                      🏪 Store Admin
                    </Text>
                    <Text style={styles.demoSub}>admin@quickmart.app</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    onClose();
                    onOpenLegal();
                  }}
                  style={{ alignItems: 'center', paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
                    Terms, Privacy, Refund Policy & Store Support →
                  </Text>
                </Pressable>
              </>
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
    maxHeight: '88%',
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
  dbBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  dbBadgeText: {
    fontSize: 10,
    fontWeight: '800',
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
    paddingBottom: 28,
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  switchTabActive: {
    backgroundColor: COLORS.white,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  switchTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  offlineNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  demoSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileWrap: {
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  rolePill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
  profileMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
  },
  adminBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
