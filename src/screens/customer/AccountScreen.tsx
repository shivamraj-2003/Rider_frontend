import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { IconBell, IconChevronRight, IconMapPin, IconShieldCheck } from '@tabler/icons-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import { useAuth } from '../../context/AuthContext';
import { colors, font, radius, shadow, space } from '../../theme';
import type { CustomerStackParamList, CustomerTabParamList } from '../../navigation/CustomerNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Account'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

export default function AccountScreen({ navigation }: Props) {
  const { user } = useAuth();
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
