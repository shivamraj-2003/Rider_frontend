import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import SearchBar from '../../../components/admin/SearchBar';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { useDebounced } from '../../../components/admin/useDebounced';
import * as adminApi from '../../../services/admin';
import { space } from '../../../theme';
import type { UserRole } from '../../../types';
import type { UsersStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<UsersStackParamList, 'UsersList'>;

const ROLES = [
  { value: 'all', label: 'All' },
  { value: 'customer', label: 'Customers' },
  { value: 'rider', label: 'Riders' },
  { value: 'admin', label: 'Admins' },
];

export default function UsersListScreen() {
  const navigation = useNavigation<Nav>();
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const q = useDebounced(query, 350);

  const fetcher = useCallback(
    () =>
      adminApi.getUsers({
        role: role === 'all' ? undefined : (role as UserRole),
        q: q || undefined,
        limit: 100,
      }),
    [role, q]
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Users" back={false} refreshing={refreshing} onRefresh={onRefresh}>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Name, phone or email" />
      <View style={styles.filters}>
        <SegmentedTabs options={ROLES} value={role} onChange={setRole} />
      </View>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No users found" hint={q ? 'Try a different search.' : undefined} />
      ) : (
        <SectionCard padded={false}>
          {data.map((u, i) => (
            <ListRow
              key={u.id}
              leading={(u.full_name ?? u.phone ?? '?').replace('+', '')}
              title={u.full_name ?? 'Unnamed'}
              subtitle={`${u.phone ?? '—'} · ${u.role}`}
              trailing={<StatusBadge status={u.is_active ? 'active' : 'inactive'} />}
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('UserDetail', { userId: u.id })}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({ filters: { marginVertical: space.xs } });
