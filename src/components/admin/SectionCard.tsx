import React, { PropsWithChildren, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../../theme';

interface Props {
  title?: string;
  action?: { label: string; onPress: () => void };
  padded?: boolean;
  footer?: ReactNode;
}

export default function SectionCard({
  title,
  action,
  padded = true,
  footer,
  children,
}: PropsWithChildren<Props>) {
  return (
    <View style={styles.card}>
      {title || action ? (
        <View style={styles.head}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {action ? (
            <Pressable onPress={action.onPress} hitSlop={8}>
              <Text style={styles.action}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={padded ? styles.body : undefined}>{children}</View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line100,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: { fontFamily: font.bold, fontSize: 14, color: colors.navy800 },
  action: { fontFamily: font.bold, fontSize: 12.5, color: colors.accentDark },
  body: { paddingHorizontal: space.md, paddingBottom: space.md, paddingTop: 2 },
});
