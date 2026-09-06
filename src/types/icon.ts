import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

// The shape of a @tabler/icons-react-native icon component. Use this to type an
// `icon` prop instead of importing `Icon` from the package (its published
// types are broken — see src/types/tabler-icons.d.ts).
export type TablerIcon = FC<
  SvgProps & {
    size?: number | string;
    color?: string;
    stroke?: number | string;
    strokeWidth?: number | string;
  }
>;
