import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { IconChevronRight } from '@tabler/icons-react-native';
import { colors, font, radius, space } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  // Leading: a short glyph/initials bubble, or a custom node.
  leading?: string | ReactNode;
  // Trailing: a value string, a node (e.g. StatusBadge), or nothing.
  trailing?: string | ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  divider?: boolean;
}

export default function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron,
  onPress,
  divider = true,
}: Props) {
  const Container: any = onPress ? Pressable : View;
  return (
    <Container
      style={({ pressed }: { pressed?: boolean }) => [
        styles.row,
        divider && styles.divider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {leading != null ? (
        typeof leading === 'string' ? (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{leading.slice(0, 2).toUpperCase()}</Text>
          </View>
        ) : (
          <View style={styles.leadingNode}>{leading}</View>
        )
      ) : null}

      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {typeof trailing === 'string' ? (
        <Text style={styles.trailingText} numberOfLines={1}>
          {trailing}
        </Text>
      ) : trailing ? (
        <View style={styles.trailingNode}>{trailing}</View>
      ) : null}

      {chevron ? <IconChevronRight size={18} color={colors.ink400} strokeWidth={2} /> : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line100 },
  pressed: { backgroundColor: colors.surface50 },
  bubble: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: { fontFamily: font.bold, fontSize: 13, color: colors.accentDark },
  leadingNode: { width: 38, alignItems: 'center' },
  textCol: { flex: 1 },
  title: { fontFamily: font.bold, fontSize: 14, color: colors.navy800 },
  subtitle: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink400, marginTop: 1 },
  trailingText: { fontFamily: font.bold, fontSize: 13, color: colors.navy800 },
  trailingNode: {},
});
