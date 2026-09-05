import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth, ApiError } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
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
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
});
