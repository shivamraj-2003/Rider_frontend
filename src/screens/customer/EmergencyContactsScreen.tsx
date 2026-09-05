import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconArrowLeft, IconTrash, IconUserPlus } from '@tabler/icons-react-native';
import { addEmergencyContact, deleteEmergencyContact, getEmergencyContacts } from '../../services/safety';
import type { EmergencyContact } from '../../services/safety';
import { ApiError } from '../../services/api';
import { colors, font, radius, space } from '../../theme';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'EmergencyContacts'>;

const MAX_CONTACTS = 5;

export default function EmergencyContactsScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getEmergencyContacts()
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  useFocusEffect(load);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Enter a name and phone number');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addEmergencyContact({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() || undefined });
      setName('');
      setPhone('');
      setRelationship('');
      setAdding(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add this contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteEmergencyContact(id);
      load();
    } catch {
      // Best-effort — leave the row as is on failure.
    } finally {
      setDeletingId(null);
    }
  };

  const atLimit = (contacts?.length ?? 0) >= MAX_CONTACTS;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Emergency contacts</Text>
      </View>

      <View style={styles.body}>
        {contacts === null ? (
          <ActivityIndicator color={colors.accentDark} />
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.phone}{item.relationship ? ` · ${item.relationship}` : ''}</Text>
                </View>
                <Pressable onPress={() => handleDelete(item.id)} disabled={deletingId === item.id} hitSlop={8}>
                  <IconTrash size={18} color={colors.danger} strokeWidth={1.75} />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No emergency contacts yet.</Text>}
          />
        )}

        {adding ? (
          <View style={styles.form}>
            <TextField label="Name" value={name} onChangeText={setName} />
            <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextField label="Relationship (optional)" value={relationship} onChangeText={setRelationship} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Save contact" onPress={handleAdd} loading={submitting} />
            <Button title="Cancel" variant="secondary" onPress={() => setAdding(false)} />
          </View>
        ) : (
          <Pressable
            style={[styles.addRow, atLimit && styles.addRowDisabled]}
            onPress={() => !atLimit && setAdding(true)}
            disabled={atLimit}
          >
            <IconUserPlus size={18} color={atLimit ? colors.ink400 : colors.accentDark} strokeWidth={1.75} />
            <Text style={[styles.addLabel, atLimit && styles.addLabelDisabled]}>
              {atLimit ? `Up to ${MAX_CONTACTS} contacts` : 'Add contact'}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: 28, paddingTop: 18 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.extrabold, fontSize: 20, color: colors.navy800 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: space.lg, gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.line100 },
  rowBody: { gap: 2 },
  rowTitle: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  rowSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  empty: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.line200,
    borderStyle: 'dashed',
  },
  addRowDisabled: { opacity: 0.5 },
  addLabel: { fontFamily: font.semibold, fontSize: 14, color: colors.accentDark },
  addLabelDisabled: { color: colors.ink400 },
  form: { gap: space.sm },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
