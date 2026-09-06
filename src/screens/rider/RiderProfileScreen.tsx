import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import Button from '../../components/Button';
import GradientCard from '../../components/GradientCard';
import { GlyphTile } from '../../components/booking';
import { IconCircleCheckFilled } from '@tabler/icons-react-native';
import { useAuth, ApiError } from '../../context/AuthContext';
import { getRiderMe, uploadRiderDocument } from '../../services/rider';
import { colors, font, radius, shadow, space } from '../../theme';
import { VEHICLE_META } from '../../types';
import type { RiderMe } from '../../types';

// RiderNavigator's gate only ever mounts this screen once RiderProfile.status
// === 'approved', so this is a read-only profile view, not an onboarding
// form — onboarding lives in the "Become a Rider" wizard (BecomeRiderNavigator).
// The User and Rider flows are fully separate now: there is no in-session
// mode switch, only ScreenScaffold's logout — a rider who wants the customer
// app signs out and picks "User" on the next login.
export default function RiderProfileScreen() {
  const { user } = useAuth();
  const [riderMe, setRiderMe] = useState<RiderMe | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getRiderMe()
      .then(setRiderMe)
      .catch(() => setRiderMe(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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
        <DocumentRow
          label="Driving licence"
          uploaded={!!riderMe.licence_doc_path}
          loading={uploading === 'licence'}
          onPress={() => handleUpload('licence')}
        />
        <DocumentRow
          label="Vehicle registration (RC)"
          uploaded={!!riderMe.rc_doc_path}
          loading={uploading === 'rc'}
          onPress={() => handleUpload('rc')}
        />
        <DocumentRow
          label="Aadhaar card"
          uploaded={!!riderMe.aadhaar_doc_path}
          loading={uploading === 'aadhaar'}
          onPress={() => handleUpload('aadhaar')}
        />
      </View>
    </View>
  );
}

function DocumentRow({
  label,
  uploaded,
  loading,
  onPress,
}: {
  label: string;
  uploaded: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.docRow}>
      <View style={styles.docRowBody}>
        <Text style={styles.docName}>{label}</Text>
        {uploaded ? (
          <View style={styles.docStatusRow}>
            <IconCircleCheckFilled size={15} color={colors.success} strokeWidth={1.75} />
            <Text style={styles.docUploaded}>Uploaded</Text>
          </View>
        ) : (
          <Text style={styles.docMissing}>Not uploaded</Text>
        )}
      </View>
      <Button
        title={uploaded ? 'Replace' : 'Upload'}
        variant="secondary"
        onPress={onPress}
        loading={loading}
        style={styles.docButton}
      />
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
  docSection: { gap: space.sm, marginTop: space.sm },
  docLabel: { fontFamily: font.bold, fontSize: 13, color: colors.ink600, marginBottom: 2 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  docRowBody: { flex: 1, gap: 3 },
  docName: { fontFamily: font.bold, fontSize: 14.5, color: colors.navy800 },
  docStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  docUploaded: { fontFamily: font.semibold, fontSize: 12.5, color: colors.success },
  docMissing: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink400 },
  docButton: { minWidth: 96, height: 40, paddingHorizontal: space.md },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
