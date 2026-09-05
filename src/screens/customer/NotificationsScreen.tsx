import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconArrowLeft, IconBell } from '@tabler/icons-react-native';
import { getNotifications, markNotificationRead } from '../../services/reviews';
import type { NotificationOut } from '../../services/reviews';
import { colors, font, radius, space } from '../../theme';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<NotificationOut[] | null>(null);

  const load = useCallback(() => {
    getNotifications()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useFocusEffect(load);

  const handlePress = async (n: NotificationOut) => {
    if (!n.read) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev);
      try {
        await markNotificationRead(n.id);
      } catch {
        // Best-effort — a missed mark-as-read isn't worth surfacing.
      }
    }
  };

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
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.body}>
        {items === null ? (
          <ActivityIndicator color={colors.accentDark} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={[styles.row, !item.read && styles.rowUnread]} onPress={() => handlePress(item)}>
                <View style={styles.rowIcon}>
                  <IconBell size={18} color={colors.accentDark} strokeWidth={1.75} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.body}</Text>
                </View>
                {!item.read ? <View style={styles.dot} /> : null}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
          />
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
  body: { flex: 1, paddingHorizontal: 28, paddingTop: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.line100 },
  rowUnread: { backgroundColor: colors.accentFaint },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: font.bold, fontSize: 14.5, color: colors.navy800 },
  rowSub: { fontFamily: font.regular, fontSize: 13, color: colors.ink600 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  empty: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600, textAlign: 'center', marginTop: space.xl },
});
