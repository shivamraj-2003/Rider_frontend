import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { getRiderMe, onboardRider, uploadRiderDocument } from '../../services/rider';
import { ApiError } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';
import type { RiderMe, VehicleType } from '../../types';

const VEHICLE_TYPES: VehicleType[] = ['bike', 'auto', 'car'];

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

  return (
    <ScreenScaffold title="Rider Profile">
      <InfoCard label="Name" value={user?.full_name ?? '—'} />
      <InfoCard label="Phone" value={user?.phone ?? '—'} />

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : riderMe ? (
        <RiderDetails riderMe={riderMe} onDocumentsUploaded={load} />
      ) : (
        <OnboardingForm onOnboarded={load} />
      )}
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
      <InfoCard label="Vehicle" value={`${riderMe.vehicle_type} · ${riderMe.vehicle_number}`} />
      <InfoCard label="Model" value={riderMe.vehicle_model} />
      <InfoCard label="Status" value={riderMe.status.replace(/_/g, ' ')} />

      {riderMe.status === 'pending_verification' ? (
        <View style={styles.docSection}>
          <Text style={styles.docLabel}>Upload documents for verification</Text>
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
      ) : null}
    </View>
  );
}

function OnboardingForm({ onOnboarded }: { onOnboarded: () => void }) {
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!vehicleNumber.trim() || !vehicleModel.trim() || !licenceNumber.trim()) {
      setError('Fill in all fields');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onboardRider({
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber.trim(),
        vehicle_model: vehicleModel.trim(),
        licence_number: licenceNumber.trim(),
      });
      onOnboarded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.docLabel}>Become a rider</Text>

      <View style={styles.vehicleRow}>
        {VEHICLE_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[styles.vehicleChip, vehicleType === type && styles.vehicleChipSelected]}
            onPress={() => setVehicleType(type)}
          >
            <Text style={[styles.vehicleChipLabel, vehicleType === type && styles.vehicleChipLabelSelected]}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextField label="Vehicle number" placeholder="DL1AB1234" value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />
      <TextField label="Vehicle model" placeholder="Splendor" value={vehicleModel} onChangeText={setVehicleModel} />
      <TextField label="Licence number" placeholder="DL-0420110149646" value={licenceNumber} onChangeText={setLicenceNumber} autoCapitalize="characters" />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Submit" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  docSection: { gap: spacing.md, marginTop: spacing.sm },
  docLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.danger },
  vehicleRow: { flexDirection: 'row', gap: spacing.sm },
  vehicleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  vehicleChipSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  vehicleChipLabel: { ...typography.bodyStrong, color: colors.primary, textTransform: 'capitalize' },
  vehicleChipLabelSelected: { color: colors.textInverse },
});
