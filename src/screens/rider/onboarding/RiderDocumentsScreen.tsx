import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconFileCheck, IconUpload } from '@tabler/icons-react-native';
import { useBecomeRiderWizard } from '../../../context/BecomeRiderWizardContext';
import type { PickedDocument } from '../../../context/BecomeRiderWizardContext';
import { colors, font, radius, space } from '../../../theme';
import type { BecomeRiderStackParamList } from '../../../navigation/BecomeRiderNavigator';
import WizardStepScaffold from './WizardStepScaffold';

type Props = NativeStackScreenProps<BecomeRiderStackParamList, 'Documents'>;

// Images are only picked and previewed here — they upload to Supabase
// Storage only after the profile exists (RiderReviewScreen's submit), since
// the presigned-URL endpoint requires an existing RiderProfile.
export default function RiderDocumentsScreen({ navigation }: Props) {
  const { data, update } = useBecomeRiderWizard();
  const [error, setError] = useState<string | null>(null);

  const pick = async (field: 'licenceDoc' | 'rcDoc' | 'aadhaarDoc') => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const doc: PickedDocument = { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
    update({ [field]: doc } as Partial<typeof data>);
  };

  const handleNext = () => {
    // Aadhaar is mandatory KYC, same as the licence and RC photos.
    if (!data.licenceDoc || !data.rcDoc || !data.aadhaarDoc) {
      setError('Add your licence, vehicle registration, and Aadhaar photos');
      return;
    }
    setError(null);
    navigation.navigate('BankDetails');
  };

  return (
    <WizardStepScaffold
      title="Your documents"
      subtitle="Clear photos speed up verification"
      step={1}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <DocumentPicker
        label="Driving licence"
        doc={data.licenceDoc}
        onPick={() => pick('licenceDoc')}
      />
      <DocumentPicker
        label="Vehicle registration (RC)"
        doc={data.rcDoc}
        onPick={() => pick('rcDoc')}
      />
      <DocumentPicker
        label="Aadhaar card"
        doc={data.aadhaarDoc}
        onPick={() => pick('aadhaarDoc')}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </WizardStepScaffold>
  );
}

function DocumentPicker({
  label,
  doc,
  onPick,
}: {
  label: string;
  doc: PickedDocument | null;
  onPick: () => void;
}) {
  return (
    <Pressable onPress={onPick} style={styles.card} accessibilityRole="button">
      {doc ? (
        <Image source={{ uri: doc.uri }} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <IconUpload size={22} color={colors.ink400} strokeWidth={1.75} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardStatus}>{doc ? 'Selected — tap to change' : 'Tap to choose a photo'}</Text>
      </View>
      {doc ? <IconFileCheck size={20} color={colors.success} strokeWidth={2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.line200,
  },
  thumb: { width: 52, height: 52, borderRadius: radius.tile },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.tile,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardLabel: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  cardStatus: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
