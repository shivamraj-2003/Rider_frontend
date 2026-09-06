import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import Button from '../../components/Button';
import GradientCard from '../../components/GradientCard';
import { GlyphTile } from '../../components/booking';
import { useAuth, ApiError } from '../../context/AuthContext';
import { getRiderMe, uploadRiderDocument } from '../../services/rider';
import { colors, font, radius, shadow, space } from '../../theme';
import { VEHICLE_META } from '../../types';
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

  const initial = (user?.full_name?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <ScreenScaffold title="Rider Profile">
      <GradientCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View style={styles.profileBody}>
          <Text style={styles.profileName}>{user?.full_name ?? '—'}</Text>
          <Text style={styles.profileSub}>{user?.phone ?? '—'}</Text>
        </View>
      </GradientCard>

      {loading ? (
        <ActivityIndicator color={colors.accentDark} />
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
  const [uploading, setUploading] = useState<'licence' | 'rc' | 'aadhaar' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meta = VEHICLE_META[riderMe.vehicle_type];

  const handleUpload = async (docType: 'licence' | 'rc' | 'aadhaar') => {
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
      <View style={styles.vehicleCard}>
        <GlyphTile icon={meta.icon} tone="accent" />
        <View style={styles.vehicleBody}>
          <Text style={styles.vehicleTitle}>{meta.label} · {riderMe.vehicle_number ?? '—'}</Text>
          <Text style={styles.vehicleSub}>{riderMe.total_trips} trips · {riderMe.rating != null ? `${riderMe.rating.toFixed(1)} ★` : 'No rating yet'}</Text>
        </View>
      </View>

      {riderMe.aadhaar_number ? (
        <InfoCard label="Aadhaar" value={`•••• •••• ${riderMe.aadhaar_number.slice(-4)}`} />
      ) : null}

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
        <Button
          title="Upload Aadhaar"
          variant="secondary"
          onPress={() => handleUpload('aadhaar')}
          loading={uploading === 'aadhaar'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: font.extrabold, fontSize: 22, color: colors.white },
  profileBody: { flex: 1, gap: 2 },
  profileName: { fontFamily: font.extrabold, fontSize: 18, color: colors.white },
  profileSub: { fontFamily: font.regular, fontSize: 13.5, color: 'rgba(255,255,255,0.7)' },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  vehicleBody: { flex: 1, gap: 2 },
  vehicleTitle: { fontFamily: font.bold, fontSize: 15.5, color: colors.navy800 },
  vehicleSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  section: { gap: space.md },
  docSection: { gap: space.md, marginTop: space.sm },
  docLabel: { fontFamily: font.bold, fontSize: 13, color: colors.ink600 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
