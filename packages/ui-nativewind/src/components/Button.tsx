// packages/ui-nativewind/src/components/Button.tsx

import type { PressableProps } from 'react-native'

import { Pressable, Text as RNText } from 'react-native'

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
}
export type ButtonSize = 'lg' | 'md' | 'sm'

export type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary'

const containerByVariant: Record<ButtonVariant, string> = {
  danger: 'bg-danger active:opacity-80',
  ghost: 'bg-transparent active:bg-surface-muted',
  primary: 'bg-brand active:opacity-80',
  secondary: 'bg-surface-muted border border-border active:opacity-80',
}

const labelByVariant: Record<ButtonVariant, string> = {
  danger: 'text-white',
  ghost: 'text-fg',
  primary: 'text-white',
  secondary: 'text-fg',
}

const sizing: Record<ButtonSize, { container: string; label: string }> = {
  lg: { container: 'px-lg py-md rounded-lg', label: 'text-lg' },
  md: { container: 'px-md py-sm rounded-md', label: 'text-md' },
  sm: { container: 'px-sm py-xs rounded-sm', label: 'text-sm' },
}

export function Button({
  children,
  size = 'md',
  variant = 'primary',
  ...rest
}: ButtonProps): JSX.Element {
  const sz = sizing[size]
  return (
    <Pressable
      accessibilityRole="button"
      className={`flex-row items-center justify-center ${sz.container} ${containerByVariant[variant]}`}
      {...rest}
    >
      <RNText className={`font-semibold ${sz.label} ${labelByVariant[variant]}`}>
        {children}
      </RNText>
    </Pressable>
  )
}
