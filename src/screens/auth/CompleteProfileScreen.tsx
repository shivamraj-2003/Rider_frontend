import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth, ApiError } from '../../context/AuthContext';
import { colors, font, space } from '../../theme';
import Button from '../../components/Button';
import TextField from '../../components/TextField';

export default function CompleteProfileScreen() {
  const { completeProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (fullName.trim().length < 2) {
      setError('Enter your full name');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await completeProfile(fullName.trim(), email.trim() || undefined);
      // AuthContext flips to "signed-in"; RootNavigator swaps automatically.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>This is how riders and drivers will see you</Text>

      <TextField placeholder="Full name" autoFocus value={fullName} onChangeText={setFullName} />
      <TextField
        placeholder="Email (optional)"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Continue" onPress={handleSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 28, gap: space.lg, justifyContent: 'center' },
  title: { fontFamily: font.extrabold, fontSize: 27, letterSpacing: -0.5, color: colors.navy800 },
  subtitle: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.ink600, marginBottom: space.sm },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
