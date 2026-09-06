import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconPlus } from '@tabler/icons-react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money, shortDate } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';
import type { PromotionRow } from '../../../types/admin';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Offers'>;

const describe = (o: PromotionRow) =>
  o.discount_type === 'percent'
    ? `${o.discount_value}% off${o.max_discount ? ` up to ${money(o.max_discount)}` : ''}`
    : `${money(o.discount_value)} off`;

export default function OffersScreen() {
  const navigation = useNavigation<Nav>();
  const fetcher = useCallback(() => adminApi.getOffers(false), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen
      title="Offers"
      right={
        <Pressable onPress={() => navigation.navigate('OfferEdit')} hitSlop={10}>
          <IconPlus size={22} color={colors.accentDark} strokeWidth={2.4} />
        </Pressable>
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No offers" hint="Tap + to create a promo code." />
      ) : (
        <SectionCard padded={false}>
          {data.map((o, i) => (
            <ListRow
              key={o.id}
              leading={o.code.slice(0, 2)}
              title={`${o.code} · ${o.title}`}
              subtitle={`${describe(o)}${o.valid_until ? ` · till ${shortDate(o.valid_until)}` : ''} · used ${o.used_count}${o.usage_limit ? `/${o.usage_limit}` : ''}`}
              trailing={<StatusBadge status={o.is_active ? 'active' : 'inactive'} />}
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('OfferEdit', { offerId: o.id })}
            />
          ))}
        </SectionCard>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Promo rules only. Customer-side redemption is handled by the booking flow.
        </Text>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  footer: { paddingTop: 4 },
  footerText: { fontFamily: font.regular, fontSize: 11, color: colors.ink400, textAlign: 'center' },
});
