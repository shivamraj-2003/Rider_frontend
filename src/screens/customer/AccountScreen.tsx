import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { IconBell, IconChevronRight, IconMapPin, IconShieldCheck } from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import Button from '../../components/Button';
import { useAuth, ApiError } from '../../context/AuthContext';
import { getRiderMe } from '../../services/rider';
import { colors, radius, spacing, typography } from '../../theme';
import type { RiderMe } from '../../types';
import type { CustomerStackParamList, CustomerTabParamList } from '../../navigation/CustomerNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Account'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

const STATUS_COPY: Record<string, string> = {
  pending_verification: 'Your application is being reviewed. We’ll let you know once it’s approved.',
  rejected: 'Your rider application wasn’t approved. Contact support for details.',
  suspended: 'Your rider account is currently suspended.',
};

export default function AccountScreen({ navigation }: Props) {
  const { user, switchRole } = useAuth();
  const [riderMe, setRiderMe] = useState<RiderMe | null | undefined>(undefined); // undefined = loading
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRiderStatus = useCallback(() => {
    getRiderMe()
      .then(setRiderMe)
      .catch(() => setRiderMe(null));
  }, []);

  // Re-check on every focus: a rider application submitted elsewhere, or an
  // admin decision, should reflect here without a manual refresh.
  useFocusEffect(loadRiderStatus);

  const handleSwitchToRider = async () => {
    setError(null);
    setSwitching(true);
    try {
      await switchRole('rider');
      // AuthContext.user.role flips → RootNavigator swaps to RiderNavigator.
    } catch (err) {
      setSwitching(false);
      setError(err instanceof ApiError ? err.message : 'Could not switch to Rider Mode.');
    }
  };

  return (
    <ScreenScaffold title="Account">
      <InfoCard label="Name" value={user?.full_name ?? '—'} />
      <InfoCard label="Phone" value={user?.phone ?? '—'} />
      <InfoCard label="Email" value={user?.email ?? '—'} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riding for Top Rider</Text>

        {riderMe === undefined ? (
          <ActivityIndicator color={colors.primary} />
        ) : riderMe === null ? (
          <Button title="Become a Rider" variant="navy" onPress={() => navigation.navigate('BecomeRider')} />
        ) : riderMe.status === 'approved' ? (
          <Button title="Switch to Rider Mode" variant="navy" onPress={handleSwitchToRider} loading={switching} />
        ) : (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>{STATUS_COPY[riderMe.status] ?? riderMe.status}</Text>
          </View>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.menu}>
        <MenuRow icon={IconMapPin} label="Saved places" onPress={() => navigation.navigate('SavedPlaces')} />
        <MenuRow icon={IconBell} label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <MenuRow icon={IconShieldCheck} label="Safety · Emergency contacts" onPress={() => navigation.navigate('EmergencyContacts')} />
      </View>
    </ScreenScaffold>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof IconMapPin;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress} accessibilityRole="button">
      <Icon size={20} color={colors.textSecondary} strokeWidth={1.75} />
      <Text style={styles.menuLabel}>{label}</Text>
      <IconChevronRight size={18} color={colors.textSecondary} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { ...typography.label, color: colors.textSecondary },
  noticeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  noticeText: { ...typography.body, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.danger },
  menu: { marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
});
