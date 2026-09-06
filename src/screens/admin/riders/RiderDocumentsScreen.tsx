import React, { useCallback, useState } from 'react';
import { View, Text, Image, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import Button from '../../../components/Button';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, radius, space } from '../../../theme';
import type { RidersStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<RidersStackParamList, 'RiderDocuments'>;
type Rt = RouteProp<RidersStackParamList, 'RiderDocuments'>;

const DOCS: { key: 'licence' | 'rc'; label: string }[] = [
  { key: 'licence', label: 'Driving Licence' },
  { key: 'rc', label: 'Registration Certificate (RC)' },
];

export default function RiderDocumentsScreen() {
  const navigation = useNavigation<Nav>();
  const { riderId, riderName } = useRoute<Rt>().params;
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback(() => adminApi.getRiderDocuments(riderId), [riderId]);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher, {
    refetchOnFocus: false,
  });

  const decide = (approve: boolean) => {
    Alert.alert(
      approve ? 'Approve rider?' : 'Reject documents?',
      approve ? 'The rider can go online after this.' : 'The rider stays blocked from trips.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approve ? 'Approve' : 'Reject',
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await adminApi.setRiderStatus(riderId, approve ? 'approved' : 'rejected');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Failed', e instanceof ApiError ? e.message : 'Try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <AdminScreen title="Documents" subtitle={riderName} refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <>
          {DOCS.map((doc) => (
            <SectionCard key={doc.key} title={doc.label}>
              {data[doc.key] ? (
                <Image source={{ uri: data[doc.key] as string }} style={styles.doc} resizeMode="cover" />
              ) : (
                <Text style={styles.missing}>Not uploaded</Text>
              )}
            </SectionCard>
          ))}
          <Text style={styles.note}>Signed links expire in ~5 minutes. Pull to refresh.</Text>

          <View style={styles.actions}>
            <Button title="Approve rider" variant="navy" loading={busy} onPress={() => decide(true)} />
            <Button title="Reject" variant="primary" loading={busy} onPress={() => decide(false)} />
          </View>
        </>
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  doc: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.surface100 },
  missing: { fontFamily: font.medium, fontSize: 13, color: colors.ink400, paddingVertical: space.md },
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
  actions: { gap: space.sm, marginTop: space.sm },
});
