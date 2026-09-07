import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBecomeRiderWizard } from '../../../context/BecomeRiderWizardContext';
import { colors, font, radius, space } from '../../../theme';
import TextField from '../../../components/TextField';
import { GlyphTile } from '../../../components/booking';
import { VEHICLE_META } from '../../../types';
import type { VehicleType } from '../../../types';
import type { BecomeRiderStackParamList } from '../../../navigation/BecomeRiderNavigator';
import WizardStepScaffold from './WizardStepScaffold';

type Props = NativeStackScreenProps<BecomeRiderStackParamList, 'VehicleDetails'>;

const VEHICLE_TYPES: VehicleType[] = ['bike', 'auto', 'tempo', 'car'];
const AADHAAR_RE = /^\d{12}$/;

export default function RiderVehicleDetailsScreen({ navigation }: Props) {
  const { data, update } = useBecomeRiderWizard();
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!data.vehicle_number.trim()) {
      setError('Enter your vehicle number');
      return;
    }
    if (!data.licence_number.trim()) {
      setError('Enter your driving licence number');
      return;
    }
    // Aadhaar is mandatory KYC for every rider — no onboarding without it.
    if (!AADHAAR_RE.test(data.aadhaar_number.trim())) {
      setError('Enter a valid 12-digit Aadhaar number');
      return;
    }
    setError(null);
    navigation.navigate('Documents');
  };

  return (
    <WizardStepScaffold
      title="Your vehicle"
      subtitle="Tell us what you'll be driving"
      step={0}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <View style={styles.chips}>
        {VEHICLE_TYPES.map((vt) => {
          const meta = VEHICLE_META[vt];
          const selected = data.vehicle_type === vt;
          return (
            <Pressable
              key={vt}
              onPress={() => update({ vehicle_type: vt })}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <GlyphTile icon={meta.icon} tone={selected ? 'accent' : 'muted'} />
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Vehicle number"
        placeholder="e.g. KA 03 AB 1234"
        autoCapitalize="characters"
        value={data.vehicle_number}
        onChangeText={(t) => update({ vehicle_number: t })}
      />
      <TextField
        label="Vehicle model (optional)"
        placeholder="e.g. Honda Activa"
        value={data.vehicle_model}
        onChangeText={(t) => update({ vehicle_model: t })}
      />
      <TextField
        label="Driving licence number"
        placeholder="Licence number"
        autoCapitalize="characters"
        value={data.licence_number}
        onChangeText={(t) => update({ licence_number: t })}
      />
      <TextField
        label="Aadhaar number"
        placeholder="12-digit Aadhaar number"
        keyboardType="number-pad"
        maxLength={12}
        value={data.aadhaar_number}
        onChangeText={(t) => update({ aadhaar_number: t.replace(/\D/g, '') })}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </WizardStepScaffold>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: space.md },
  chip: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.line200,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentFaint },
  chipLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.ink600 },
  chipLabelSelected: { color: colors.accentDark },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
