import React, { useCallback, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import StatGrid from '../../../components/admin/StatGrid';
import StatCard from '../../../components/admin/StatCard';
import StatusBadge from '../../../components/admin/StatusBadge';
import Button from '../../../components/Button';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money, shortDate } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, space } from '../../../theme';
import type { UserRole } from '../../../types';
import type { UsersStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<UsersStackParamList, 'UserDetail'>;
type Rt = RouteProp<UsersStackParamList, 'UserDetail'>;

export default function UserDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { userId } = useRoute<Rt>().params;
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback(() => adminApi.getUserDetail(userId), [userId]);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const guard = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refetch();
    } catch (e) {
      Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = () => {
    if (!data) return;
    const blocking = data.user.is_active;
    Alert.alert(
      blocking ? 'Block user?' : 'Unblock user?',
      blocking ? 'They will not be able to sign in or book.' : 'They regain full access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: blocking ? 'Block' : 'Unblock',
          style: blocking ? 'destructive' : 'default',
          onPress: () =>
            guard(() =>
              blocking ? adminApi.deactivateUser(userId) : adminApi.activateUser(userId)
            ),
        },
      ]
    );
  };

  const changeRole = () => {
    if (!data) return;
    const roles: UserRole[] = ['customer', 'rider', 'admin'];
    Alert.alert('Change role', `Current: ${data.user.role}`, [
      ...roles
        .filter((r) => r !== data.user.role)
        .map((r) => ({
          text: `Set ${r}`,
          onPress: () => guard(() => adminApi.setUserRole(userId, r)),
        })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <AdminScreen title="User Details" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <>
          <SectionCard>
            <View style={styles.headRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(data.user.full_name ?? data.user.phone ?? '?').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headText}>
                <Text style={styles.name}>{data.user.full_name ?? 'Unnamed user'}</Text>
                <Text style={styles.meta}>{data.user.phone ?? '—'}</Text>
                {data.user.email ? <Text style={styles.meta}>{data.user.email}</Text> : null}
              </View>
              <StatusBadge status={data.user.is_active ? 'active' : 'inactive'} />
            </View>
            <Text style={styles.since}>
              {data.user.role.toUpperCase()} · member since {shortDate(data.member_since)}
            </Text>
          </SectionCard>

          <StatGrid>
            <StatCard label="Total Rides" value={data.total_rides} />
            <StatCard label="Completed" value={data.completed_rides} />
            <StatCard label="Cancelled" value={data.cancelled_rides} />
            <StatCard label="Total Spent" value={money(data.total_spent)} />
          </StatGrid>

          <View style={styles.actions}>
            <Button
              title="View Ride History"
              variant="secondary"
              onPress={() =>
                navigation.navigate('RideHistory', {
                  phone: data.user.phone ?? '',
                  name: data.user.full_name ?? 'User',
                })
              }
            />
            <View style={styles.actionRow}>
              <View style={styles.flex}>
                <Button title="Change Role" variant="navy" onPress={changeRole} loading={busy} />
              </View>
              <View style={styles.flex}>
                <Button
                  title={data.user.is_active ? 'Block' : 'Unblock'}
                  variant={data.user.is_active ? 'primary' : 'secondary'}
                  onPress={toggleBlock}
                  loading={busy}
                />
              </View>
            </View>
          </View>
        </>
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 16, color: colors.accentDark },
  headText: { flex: 1 },
  name: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy800 },
  meta: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600, marginTop: 1 },
  since: { fontFamily: font.medium, fontSize: 11.5, color: colors.ink400, marginTop: space.sm },
  actions: { gap: space.sm, marginTop: space.xs },
  actionRow: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
