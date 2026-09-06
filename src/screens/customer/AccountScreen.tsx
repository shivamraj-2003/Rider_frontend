import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { IconBell, IconChevronRight, IconMapPin, IconShieldCheck, IconSteeringWheel } from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import Button from '../../components/Button';
import { useAuth, ApiError } from '../../context/AuthContext';
import { getRiderMe } from '../../services/rider';
import { colors, font, radius, shadow, space } from '../../theme';
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
  const [riderErr, setRiderErr] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRiderStatus = useCallback(() => {
    setRiderErr(null);
    getRiderMe()
      .then((me) => {
        setRiderMe(me);
        setRiderErr(null);
      })
      .catch((e) => {
        // Only a real 404 ("no rider profile") should fall through to the
        // Become-a-Rider CTA. A 403 (deactivated account), 500 or network
        // error must not hide a pending application — show it for retry.
        setRiderMe(null);
        if (!(e instanceof ApiError) || e.status === 404 || e.code === 'not_found') {
          setRiderErr(null);
        } else {
          setRiderErr(e.message || 'Could not load your rider status.');
        }
      });
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

  const initial = (user?.full_name?.trim()?.[0] ?? user?.phone?.slice(-2)?.[0] ?? '?').toUpperCase();

  return (
    <ScreenScaffold title="Account">
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View style={styles.profileBody}>
          <Text style={styles.profileName}>{user?.full_name ?? 'Add your name'}</Text>
          <Text style={styles.profileSub}>{user?.phone ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoHalf}><InfoCard label="Phone" value={user?.phone ?? '—'} /></View>
        <View style={styles.infoHalf}><InfoCard label="Email" value={user?.email ?? '—'} /></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riding for Top Rider</Text>

        {riderMe === undefined ? (
          <ActivityIndicator color={colors.accentDark} />
        ) : riderErr ? (
          <Pressable style={styles.noticeCard} onPress={loadRiderStatus}>
            <Text style={styles.noticeText}>{riderErr}</Text>
            <Text style={styles.error}>Tap to retry</Text>
          </Pressable>
        ) : riderMe === null ? (
          <Pressable style={styles.riderCta} onPress={() => navigation.navigate('BecomeRider')}>
            <View style={styles.riderCtaIcon}>
              <IconSteeringWheel size={22} color={colors.accentDark} strokeWidth={1.75} />
            </View>
            <View style={styles.riderCtaBody}>
              <Text style={styles.riderCtaTitle}>Become a Rider</Text>
              <Text style={styles.riderCtaSub}>Earn on your own schedule</Text>
            </View>
            <IconChevronRight size={18} color={colors.ink400} strokeWidth={1.75} />
          </Pressable>
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
        <MenuRow icon={IconShieldCheck} label="Safety · Emergency contacts" onPress={() => navigation.navigate('EmergencyContacts')} last />
      </View>
    </ScreenScaffold>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  last,
}: {
  icon: typeof IconMapPin;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.menuRow, last && styles.menuRowLast]} onPress={onPress} accessibilityRole="button">
      <View style={styles.menuIcon}>
        <Icon size={18} color={colors.navy600} strokeWidth={1.75} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <IconChevronRight size={18} color={colors.ink400} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.lg,
    ...shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: font.extrabold, fontSize: 22, color: colors.white },
  profileBody: { flex: 1, gap: 2 },
  profileName: { fontFamily: font.extrabold, fontSize: 18, color: colors.navy800 },
  profileSub: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600 },
  infoRow: { flexDirection: 'row', gap: space.md },
  infoHalf: { flex: 1 },
  section: { gap: space.sm, marginTop: space.sm },
  sectionTitle: { fontFamily: font.bold, fontSize: 13, letterSpacing: 0.2, color: colors.ink600 },
  riderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  riderCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderCtaBody: { flex: 1, gap: 2 },
  riderCtaTitle: { fontFamily: font.bold, fontSize: 15.5, color: colors.navy800 },
  riderCtaSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  noticeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.lg,
    ...shadow.card,
  },
  noticeText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.navy800 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
  menu: {
    marginTop: space.sm,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadow.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line100,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontFamily: font.semibold, fontSize: 14.5, color: colors.navy800, flex: 1 },
});
