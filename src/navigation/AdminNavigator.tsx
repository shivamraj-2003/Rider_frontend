import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconLayoutDashboard,
  IconUsers,
  IconRoute,
  IconCoin,
  IconDotsCircleHorizontal,
} from '@tabler/icons-react-native';
import { colors, font } from '../theme';
import type { VehicleType } from '../types';

// --- Home stack ----------------------------------------------------------
import DashboardScreen from '../screens/admin/home/DashboardScreen';
import LiveRidesScreen from '../screens/admin/home/LiveRidesScreen';
import RecentActivitiesScreen from '../screens/admin/home/RecentActivitiesScreen';
import AnalyticsScreen from '../screens/admin/home/AnalyticsScreen';
// --- Users stack ---------------------------------------------------------
import UsersListScreen from '../screens/admin/users/UsersListScreen';
import UserDetailScreen from '../screens/admin/users/UserDetailScreen';
import RideHistoryScreen from '../screens/admin/users/RideHistoryScreen';
// --- Riders stack -------------------------------------------------------
import RidersListScreen from '../screens/admin/riders/RidersListScreen';
import RiderDetailScreen from '../screens/admin/riders/RiderDetailScreen';
import RiderDocumentsScreen from '../screens/admin/riders/RiderDocumentsScreen';
// --- Rides stack -------------------------------------------------------
import RidesListScreen from '../screens/admin/rides/RidesListScreen';
import RideDetailScreen from '../screens/admin/rides/RideDetailScreen';
import LiveLocationScreen from '../screens/admin/rides/LiveLocationScreen';
// --- Earnings stack ---------------------------------------------------
import EarningsOverviewScreen from '../screens/admin/earnings/EarningsOverviewScreen';
import RevenueReportScreen from '../screens/admin/earnings/RevenueReportScreen';
import SettlementsScreen from '../screens/admin/earnings/SettlementsScreen';
// --- More stack -----------------------------------------------------
import MoreMenuScreen from '../screens/admin/more/MoreMenuScreen';
import PaymentsScreen from '../screens/admin/more/PaymentsScreen';
import DocumentsScreen from '../screens/admin/more/DocumentsScreen';
import OffersScreen from '../screens/admin/more/OffersScreen';
import OfferEditScreen from '../screens/admin/more/OfferEditScreen';
import PricingScreen from '../screens/admin/more/PricingScreen';
import PricingEditScreen from '../screens/admin/more/PricingEditScreen';
import CommissionScreen from '../screens/admin/more/CommissionScreen';
import PricingHistoryScreen from '../screens/admin/more/PricingHistoryScreen';
import NotificationsScreen from '../screens/admin/more/NotificationsScreen';
import ReportsScreen from '../screens/admin/more/ReportsScreen';
import SupportScreen from '../screens/admin/more/SupportScreen';
import SettingsScreen from '../screens/admin/more/SettingsScreen';
import AdminManagementScreen from '../screens/admin/more/AdminManagementScreen';
import SystemLogsScreen from '../screens/admin/more/SystemLogsScreen';

// --- param lists -------------------------------------------------------

export type AdminTabParamList = {
  HomeTab: undefined;
  UsersTab: undefined;
  RidesTab: undefined;
  EarningsTab: undefined;
  MoreTab: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  LiveRides: undefined;
  RecentActivities: undefined;
  Analytics: undefined;
  RideDetail: { bookingId: string };
  LiveLocation: { bookingId: string; reference?: string };
};

export type UsersStackParamList = {
  UsersList: undefined;
  UserDetail: { userId: string };
  RideHistory: { phone: string; name: string };
  RideDetail: { bookingId: string };
  LiveLocation: { bookingId: string; reference?: string };
};

export type RidersStackParamList = {
  RidersList: { initialStatus?: string } | undefined;
  RiderDetail: { riderId: string };
  RiderDocuments: { riderId: string; riderName?: string };
};

export type RidesStackParamList = {
  RidesList: undefined;
  RideDetail: { bookingId: string };
  LiveLocation: { bookingId: string; reference?: string };
};

export type EarningsStackParamList = {
  EarningsOverview: undefined;
  RevenueReport: { focus?: 'revenue' | 'commission' } | undefined;
  Settlements: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Payments: undefined;
  Documents: undefined;
  RidersList: { initialStatus?: string } | undefined;
  RiderDetail: { riderId: string };
  RiderDocuments: { riderId: string; riderName?: string };
  Offers: undefined;
  OfferEdit: { offerId?: string } | undefined;
  Pricing: undefined;
  PricingEdit: { vehicleType: VehicleType };
  Commission: undefined;
  PricingHistory: undefined;
  Notifications: undefined;
  Reports: undefined;
  Support: undefined;
  Settings: undefined;
  AdminManagement: undefined;
  SystemLogs: undefined;
};

const stackOpts = { headerShown: false } as const;

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={stackOpts}>
      <HomeStackNav.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStackNav.Screen name="LiveRides" component={LiveRidesScreen} />
      <HomeStackNav.Screen name="RecentActivities" component={RecentActivitiesScreen} />
      <HomeStackNav.Screen name="Analytics" component={AnalyticsScreen} />
      <HomeStackNav.Screen name="RideDetail" component={RideDetailScreen} />
      <HomeStackNav.Screen name="LiveLocation" component={LiveLocationScreen} />
    </HomeStackNav.Navigator>
  );
}

const UsersStackNav = createNativeStackNavigator<UsersStackParamList>();
function UsersStack() {
  return (
    <UsersStackNav.Navigator screenOptions={stackOpts}>
      <UsersStackNav.Screen name="UsersList" component={UsersListScreen} />
      <UsersStackNav.Screen name="UserDetail" component={UserDetailScreen} />
      <UsersStackNav.Screen name="RideHistory" component={RideHistoryScreen} />
      <UsersStackNav.Screen name="RideDetail" component={RideDetailScreen} />
      <UsersStackNav.Screen name="LiveLocation" component={LiveLocationScreen} />
    </UsersStackNav.Navigator>
  );
}

const RidesStackNav = createNativeStackNavigator<RidesStackParamList>();
function RidesStack() {
  return (
    <RidesStackNav.Navigator screenOptions={stackOpts}>
      <RidesStackNav.Screen name="RidesList" component={RidesListScreen} />
      <RidesStackNav.Screen name="RideDetail" component={RideDetailScreen} />
      <RidesStackNav.Screen name="LiveLocation" component={LiveLocationScreen} />
    </RidesStackNav.Navigator>
  );
}

const RidersStackNav = createNativeStackNavigator<RidersStackParamList>();
export function RidersStack() {
  return (
    <RidersStackNav.Navigator screenOptions={stackOpts}>
      <RidersStackNav.Screen name="RidersList" component={RidersListScreen} />
      <RidersStackNav.Screen name="RiderDetail" component={RiderDetailScreen} />
      <RidersStackNav.Screen name="RiderDocuments" component={RiderDocumentsScreen} />
    </RidersStackNav.Navigator>
  );
}

const EarningsStackNav = createNativeStackNavigator<EarningsStackParamList>();
function EarningsStack() {
  return (
    <EarningsStackNav.Navigator screenOptions={stackOpts}>
      <EarningsStackNav.Screen name="EarningsOverview" component={EarningsOverviewScreen} />
      <EarningsStackNav.Screen name="RevenueReport" component={RevenueReportScreen} />
      <EarningsStackNav.Screen name="Settlements" component={SettlementsScreen} />
    </EarningsStackNav.Navigator>
  );
}

const MoreStackNav = createNativeStackNavigator<MoreStackParamList>();
function MoreStack() {
  return (
    <MoreStackNav.Navigator screenOptions={stackOpts}>
      <MoreStackNav.Screen name="MoreMenu" component={MoreMenuScreen} />
      <MoreStackNav.Screen name="Payments" component={PaymentsScreen} />
      <MoreStackNav.Screen name="Documents" component={DocumentsScreen} />
      <MoreStackNav.Screen name="RidersList" component={RidersListScreen} />
      <MoreStackNav.Screen name="RiderDetail" component={RiderDetailScreen} />
      <MoreStackNav.Screen name="RiderDocuments" component={RiderDocumentsScreen} />
      <MoreStackNav.Screen name="Offers" component={OffersScreen} />
      <MoreStackNav.Screen name="OfferEdit" component={OfferEditScreen} />
      <MoreStackNav.Screen name="Pricing" component={PricingScreen} />
      <MoreStackNav.Screen name="PricingEdit" component={PricingEditScreen} />
      <MoreStackNav.Screen name="Commission" component={CommissionScreen} />
      <MoreStackNav.Screen name="PricingHistory" component={PricingHistoryScreen} />
      <MoreStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <MoreStackNav.Screen name="Reports" component={ReportsScreen} />
      <MoreStackNav.Screen name="Support" component={SupportScreen} />
      <MoreStackNav.Screen name="Settings" component={SettingsScreen} />
      <MoreStackNav.Screen name="AdminManagement" component={AdminManagementScreen} />
      <MoreStackNav.Screen name="SystemLogs" component={SystemLogsScreen} />
    </MoreStackNav.Navigator>
  );
}

// --- custom bottom tab bar --------------------------------------------

const TABS: {
  name: keyof AdminTabParamList;
  label: string;
  Icon: (props: { size: number; color: string; strokeWidth: number }) => React.ReactNode;
}[] = [
  { name: 'HomeTab', label: 'Home', Icon: (p) => <IconLayoutDashboard {...p} /> },
  { name: 'UsersTab', label: 'Users', Icon: (p) => <IconUsers {...p} /> },
  { name: 'RidesTab', label: 'Rides', Icon: (p) => <IconRoute {...p} /> },
  { name: 'EarningsTab', label: 'Earnings', Icon: (p) => <IconCoin {...p} /> },
  { name: 'MoreTab', label: 'More', Icon: (p) => <IconDotsCircleHorizontal {...p} /> },
];

function AdminTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab, index) => {
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.ink400;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: state.routes[index].key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(tab.name as never);
        };
        return (
          <Pressable key={tab.name} style={styles.tabItem} onPress={onPress} accessibilityRole="button">
            {tab.Icon({ size: 23, color, strokeWidth: focused ? 2.4 : 2 })}
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AdminTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="UsersTab" component={UsersStack} />
      <Tab.Screen name="RidesTab" component={RidesStack} />
      <Tab.Screen name="EarningsTab" component={EarningsStack} />
      <Tab.Screen name="MoreTab" component={MoreStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line100,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontFamily: font.bold, fontSize: 10.5 },
});
