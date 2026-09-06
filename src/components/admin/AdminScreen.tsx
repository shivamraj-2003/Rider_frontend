import React, { PropsWithChildren, ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { colors, font, space, radius, type } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  // Show a back chevron (defaults on when the navigator can go back).
  back?: boolean;
  right?: ReactNode;
  // Wire pull-to-refresh into the scroll view.
  refreshing?: boolean;
  onRefresh?: () => void;
  // Set false when the child renders its own FlatList / scroll container.
  scroll?: boolean;
  contentStyle?: object;
}

/**
 * Shared shell for every admin screen: safe-area header (title + optional back
 * + optional right action) over a themed scroll body with pull-to-refresh.
 * Mirrors the reference mobile layout — compact header, off-white ground.
 */
export default function AdminScreen({
  title,
  subtitle,
  back,
  right,
  refreshing,
  onRefresh,
  scroll = true,
  contentStyle,
  children,
}: PropsWithChildren<Props>) {
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const showBack = back ?? canGoBack;

  const header = (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface50 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line100,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: space.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface100,
  },
  headerText: { flex: 1 },
  title: { fontFamily: font.extrabold, fontSize: 19, color: colors.navy800, letterSpacing: -0.3 },
  subtitle: { ...type.helper, marginTop: 1 },
  right: { marginLeft: space.sm },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
});
