import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import TextField from '../../../components/TextField';
import Button from '../../../components/Button';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, space } from '../../../theme';
import type { UserRole } from '../../../types';

const AUDIENCE = [
  { value: 'all', label: 'Everyone' },
  { value: 'customer', label: 'Customers' },
  { value: 'rider', label: 'Riders' },
];

export default function NotificationsScreen() {
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing fields', 'Title and message are required.');
      return;
    }
    Alert.alert('Send notification?', `This reaches ${AUDIENCE.find((a) => a.value === audience)?.label}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setBusy(true);
          try {
            const res = await adminApi.broadcast({
              title: title.trim(),
              body: body.trim(),
              role: audience === 'all' ? undefined : (audience as UserRole),
            });
            Alert.alert('Sent', `Delivered to ${res.recipients} recipient(s).`);
            setTitle('');
            setBody('');
          } catch (e) {
            Alert.alert('Failed', e instanceof ApiError ? e.message : 'Try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <AdminScreen title="Send Notification">
      <SectionCard>
        <View style={styles.form}>
          <Text style={styles.label}>Audience</Text>
          <SegmentedTabs options={AUDIENCE} value={audience} onChange={setAudience} />
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Weekend offer" />
          <TextField
            label="Message"
            value={body}
            onChangeText={setBody}
            placeholder="Get 20% off on your next 3 rides!"
            multiline
            style={styles.multiline}
          />
        </View>
      </SectionCard>
      <Button title="Send Notification" variant="navy" loading={busy} onPress={send} />
      <Text style={styles.note}>
        Written to each recipient's in-app history and pushed to their device.
      </Text>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md },
  label: { fontFamily: font.bold, fontSize: 12, color: colors.ink600 },
  multiline: { height: 110, paddingTop: 14, textAlignVertical: 'top' },
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
});
