import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBecomeRiderWizard } from '../../../context/BecomeRiderWizardContext';
import { useAuth } from '../../../context/AuthContext';
import { onboardRider, uploadRiderDocument } from '../../../services/rider';
import { ApiError } from '../../../services/api';
import { colors, font } from '../../../theme';
import InfoCard from '../../../components/InfoCard';
import { VEHICLE_META } from '../../../types';
import type { BecomeRiderStackParamList } from '../../../navigation/BecomeRiderNavigator';
import WizardStepScaffold from './WizardStepScaffold';

type Props = NativeStackScreenProps<BecomeRiderStackParamList, 'Review'>;

export default function RiderReviewScreen({ navigation }: Props) {
  const { data } = useBecomeRiderWizard();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onboardRider({
        vehicle_type: data.vehicle_type,
        vehicle_number: data.vehicle_number.trim(),
        vehicle_model: data.vehicle_model.trim() || undefined,
        licence_number: data.licence_number.trim(),
        aadhaar_number: data.aadhaar_number.trim(),
        bank_account_holder: data.bank_account_holder.trim(),
        bank_account_number: data.bank_account_number.trim(),
        bank_ifsc: data.bank_ifsc.trim(),
      });
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : 'Could not submit your application. Try again.');
      return;
    }

    // The profile now exists — upload whatever was picked. A failed upload
    // here doesn't block the application (docs can be added again from the
    // rider profile screen); only surface it, don't stop the hand-off.
    const uploadErrors: string[] = [];
    try {
      if (data.licenceDoc) await uploadRiderDocument('licence', data.licenceDoc.uri, data.licenceDoc.mimeType);
    } catch {
      uploadErrors.push('licence photo');
    }
    try {
      if (data.rcDoc) await uploadRiderDocument('rc', data.rcDoc.uri, data.rcDoc.mimeType);
    } catch {
      uploadErrors.push('vehicle registration photo');
    }
    try {
      if (data.aadhaarDoc) await uploadRiderDocument('aadhaar', data.aadhaarDoc.uri, data.aadhaarDoc.mimeType);
    } catch {
      uploadErrors.push('Aadhaar photo');
    }

    // Role flips to 'rider' server-side inside onboardRider — refresh the
    // local session so RootNavigator swaps to RiderNavigator, which will
    // show the pending-verification screen on its own.
    await refreshUser();

    if (uploadErrors.length) {
      setError(`Application submitted, but your ${uploadErrors.join(' and ')} didn't upload — add ${uploadErrors.length > 1 ? 'them' : 'it'} again from your rider profile.`);
    }
    setSubmitting(false);
  };

  const meta = VEHICLE_META[data.vehicle_type];

  return (
    <WizardStepScaffold
      title="Review your application"
      subtitle="Check everything before you submit"
      step={3}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      onNext={handleSubmit}
      nextLabel="Submit application"
      nextLoading={submitting}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <InfoCard label="Type" value={meta.label} />
        <InfoCard label="Number" value={data.vehicle_number} />
        {data.vehicle_model ? <InfoCard label="Model" value={data.vehicle_model} /> : null}
        <InfoCard label="Licence number" value={data.licence_number} />
        <InfoCard label="Aadhaar number" value={`•••• •••• ${data.aadhaar_number.slice(-4)}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        <InfoCard label="Driving licence" value={data.licenceDoc ? 'Added' : 'Missing'} />
        <InfoCard label="Vehicle registration" value={data.rcDoc ? 'Added' : 'Missing'} />
        <InfoCard label="Aadhaar card" value={data.aadhaarDoc ? 'Added' : 'Missing'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payout account</Text>
        <InfoCard label="Account holder" value={data.bank_account_holder} />
        <InfoCard label="Account number" value={`•••• ${data.bank_account_number.slice(-4)}`} />
        <InfoCard label="IFSC" value={data.bank_ifsc} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </WizardStepScaffold>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontFamily: font.bold, fontSize: 14, color: colors.ink600, marginBottom: 2 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
