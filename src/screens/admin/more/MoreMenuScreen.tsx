import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  IconCreditCard,
  IconFileCheck,
  IconTag,
  IconBell,
  IconChartBar,
  IconLifebuoy,
  IconSettings,
  IconShieldLock,
  IconHistory,
  IconLogout,
} from '@tabler/icons-react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../theme';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;
type Dest = keyof MoreStackParamList;

const GROUPS: { title: string; items: { label: string; to: Dest; Icon: any }[] }[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Payments', to: 'Payments', Icon: IconCreditCard },
      { label: 'Document Verification', to: 'Documents', Icon: IconFileCheck },
      { label: 'Offers', to: 'Offers', Icon: IconTag },
      { label: 'Notifications', to: 'Notifications', Icon: IconBell },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', to: 'Reports', Icon: IconChartBar },
      { label: 'Support / Helpdesk', to: 'Support', Icon: IconLifebuoy },
      { label: 'System Logs', to: 'SystemLogs', Icon: IconHistory },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Settings', to: 'Settings', Icon: IconSettings },
      { label: 'Admin Management', to: 'AdminManagement', Icon: IconShieldLock },
    ],
  },
];

export default function MoreMenuScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to verify your number again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <AdminScreen title="More" subtitle={user?.full_name ?? user?.phone ?? undefined} back={false}>
      {GROUPS.map((group) => (
        <SectionCard key={group.title} title={group.title} padded={false}>
          {group.items.map((item, i) => (
            <ListRow
              key={item.to}
              leading={<item.Icon size={20} color={colors.navy600} strokeWidth={2} />}
              title={item.label}
              chevron
              divider={i < group.items.length - 1}
              onPress={() => navigation.navigate(item.to as never)}
            />
          ))}
        </SectionCard>
      ))}

      <SectionCard padded={false}>
        <ListRow
          leading={<IconLogout size={20} color={colors.danger} strokeWidth={2} />}
          title="Logout"
          divider={false}
          onPress={confirmLogout}
        />
      </SectionCard>
    </AdminScreen>
  );
}
