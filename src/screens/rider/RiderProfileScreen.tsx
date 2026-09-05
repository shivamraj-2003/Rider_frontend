import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import Button from '../../components/Button';
import { useAuth, ApiError } from '../../context/AuthContext';
import { getRiderMe, uploadRiderDocument } from '../../services/rider';
import { colors, spacing, typography } from '../../theme';
import type { RiderMe } from '../../types';

// RiderNavigator's gate only ever mounts this screen once RiderProfile.status
// === 'approved', so this is a read-only profile view, not an onboarding
// form — onboarding lives in the "Become a Rider" wizard (BecomeRiderNavigator).
export default function RiderProfileScreen() {
  const { user, switchRole } = useAuth();
  const [riderMe, setRiderMe] = useState<RiderMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getRiderMe()
      .then(setRiderMe)
      .catch(() => setRiderMe(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSwitchToUser = async () => {
    setSwitchError(null);
    setSwitching(true);
    try {
      await switchRole('customer');
    } catch (err) {
      setSwitching(false);
      setSwitchError(err instanceof ApiError ? err.message : 'Could not switch to User Mode.');
    }
  };

  return (
    <ScreenScaffold title="Rider Profile">
      <InfoCard label="Name" value={user?.full_name ?? '—'} />
      <InfoCard label="Phone" value={user?.phone ?? '—'} />

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : riderMe ? (
        <RiderDetails riderMe={riderMe} onDocumentsUploaded={load} />
      ) : null}

      <View style={styles.section}>
        <Button title="Switch to User Mode" variant="navy" onPress={handleSwitchToUser} loading={switching} />
        {switchError ? <Text style={styles.error}>{switchError}</Text> : null}
      </View>
    </ScreenScaffold>
  );
}

function RiderDetails({ riderMe, onDocumentsUploaded }: { riderMe: RiderMe; onDocumentsUploaded: () => void }) {
  const [uploading, setUploading] = useState<'licence' | 'rc' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (docType: 'licence' | 'rc') => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(docType);
    try {
      const asset = result.assets[0];
      await uploadRiderDocument(docType, asset.uri, asset.mimeType ?? 'image/jpeg');
      onDocumentsUploaded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Try again.');
    } finally {
      setUploading(null);
    }
  };

  return (
    <View style={styles.section}>
      <InfoCard label="Vehicle" value={`${riderMe.vehicle_type} · ${riderMe.vehicle_number ?? '—'}`} />
      <InfoCard label="Rating" value={riderMe.rating != null ? riderMe.rating.toFixed(1) : '—'} />
      <InfoCard label="Total trips" value={String(riderMe.total_trips)} />

      {riderMe.bank_account_holder ? (
        <>
          <InfoCard label="Payout account holder" value={riderMe.bank_account_holder} />
          <InfoCard
            label="Payout account"
            value={riderMe.bank_account_number ? `•••• ${riderMe.bank_account_number.slice(-4)}` : '—'}
          />
          <InfoCard label="IFSC" value={riderMe.bank_ifsc ?? '—'} />
        </>
      ) : null}

      <View style={styles.docSection}>
        <Text style={styles.docLabel}>Documents</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Upload licence"
          variant="secondary"
          onPress={() => handleUpload('licence')}
          loading={uploading === 'licence'}
        />
        <Button
          title="Upload RC"
          variant="secondary"
          onPress={() => handleUpload('rc')}
          loading={uploading === 'rc'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  docSection: { gap: spacing.md, marginTop: spacing.sm },
  docLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.danger },
});
