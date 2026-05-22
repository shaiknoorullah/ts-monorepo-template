// packages/ui-nativewind/src/components/Text.tsx

import { Text as RNText } from 'react-native'
import type { TextProps as RNTextProps } from 'react-native'

export type TextVariant = 'body' | 'caption' | 'heading' | 'title'

export interface TextProps extends RNTextProps {
  variant?: TextVariant
  muted?: boolean
}

const byVariant: Record<TextVariant, string> = {
  body: 'text-md',
  caption: 'text-sm',
  heading: 'text-2xl font-bold',
  title: 'text-4xl font-bold tracking-tight',
}

export function Text({
  variant = 'body',
  muted,
  className,
  children,
  ...rest
}: TextProps): JSX.Element {
  return (
    <RNText
      className={`${byVariant[variant]} ${muted ? 'text-fg-muted' : 'text-fg'} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </RNText>
  )
}
