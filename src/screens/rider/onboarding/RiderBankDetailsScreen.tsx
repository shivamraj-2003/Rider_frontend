import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBecomeRiderWizard } from '../../../context/BecomeRiderWizardContext';
import { colors, font } from '../../../theme';
import TextField from '../../../components/TextField';
import type { BecomeRiderStackParamList } from '../../../navigation/BecomeRiderNavigator';
import WizardStepScaffold from './WizardStepScaffold';

type Props = NativeStackScreenProps<BecomeRiderStackParamList, 'BankDetails'>;

const ACCOUNT_NUMBER_RE = /^\d{9,18}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function RiderBankDetailsScreen({ navigation }: Props) {
  const { data, update } = useBecomeRiderWizard();
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!data.bank_account_holder.trim()) {
      setError('Enter the account holder name');
      return;
    }
    if (!ACCOUNT_NUMBER_RE.test(data.bank_account_number.trim())) {
      setError('Enter a valid account number (9–18 digits)');
      return;
    }
    if (!IFSC_RE.test(data.bank_ifsc.trim().toUpperCase())) {
      setError('Enter a valid IFSC code (e.g. HDFC0001234)');
      return;
    }
    setError(null);
    navigation.navigate('Review');
  };

  return (
    <WizardStepScaffold
      title="Payout account"
      subtitle="Where should we send your earnings?"
      step={2}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <TextField
        label="Account holder name"
        placeholder="As per bank records"
        value={data.bank_account_holder}
        onChangeText={(t) => update({ bank_account_holder: t })}
      />
      <TextField
        label="Account number"
        placeholder="Account number"
        keyboardType="number-pad"
        value={data.bank_account_number}
        onChangeText={(t) => update({ bank_account_number: t.replace(/\D/g, '') })}
      />
      <TextField
        label="IFSC code"
        placeholder="e.g. HDFC0001234"
        autoCapitalize="characters"
        value={data.bank_ifsc}
        onChangeText={(t) => update({ bank_ifsc: t.toUpperCase() })}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </WizardStepScaffold>
  );
}

const styles = StyleSheet.create({
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
