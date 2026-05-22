// packages/ui-nativewind/src/components/Text.tsx

import type { TextProps as RNTextProps } from 'react-native'

import { Text as RNText } from 'react-native'

export interface TextProps extends RNTextProps {
  muted?: boolean
  variant?: TextVariant
}

export type TextVariant = 'body' | 'caption' | 'heading' | 'title'

const byVariant: Record<TextVariant, string> = {
  body: 'text-md',
  caption: 'text-sm',
  heading: 'text-2xl font-bold',
  title: 'text-4xl font-bold tracking-tight',
}

export function Text({
  children,
  className,
  muted,
  variant = 'body',
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
