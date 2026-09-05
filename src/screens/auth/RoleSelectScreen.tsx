import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

const ROLES: { role: UserRole; label: string; description: string }[] = [
  { role: 'customer', label: 'Book a Ride', description: 'Continue as a Customer' },
  { role: 'rider', label: 'Drive & Earn', description: 'Continue as a Rider' },
  { role: 'admin', label: 'Admin Panel', description: 'Continue as an Admin' },
];

export default function RoleSelectScreen() {
  const { signIn } = useAuth();

  const handleSelect = (role: UserRole) => {
    // TODO: replace with real authentication against the backend.
    signIn({
      id: `${role}-demo-id`,
      name: `Demo ${role}`,
      phone: '0000000000',
      role,
      isVerified: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rider</Text>
      <Text style={styles.subtitle}>Choose how you want to continue</Text>
      {ROLES.map(({ role, label, description }) => (
        <Pressable key={role} style={styles.card} onPress={() => handleSelect(role)}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  cardLabel: { fontSize: 18, fontWeight: '600' },
  cardDescription: { fontSize: 13, color: '#888', marginTop: 4 },
});
