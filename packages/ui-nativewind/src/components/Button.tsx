// packages/ui-nativewind/src/components/Button.tsx

import { Pressable, Text as RNText } from 'react-native'
import type { PressableProps } from 'react-native'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

const containerByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-brand active:opacity-80',
  secondary: 'bg-surface-muted border border-border active:opacity-80',
  ghost: 'bg-transparent active:bg-surface-muted',
  danger: 'bg-danger active:opacity-80',
}

const labelByVariant: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-fg',
  ghost: 'text-fg',
  danger: 'text-white',
}

const sizing: Record<ButtonSize, { container: string; label: string }> = {
  sm: { container: 'px-sm py-xs rounded-sm', label: 'text-sm' },
  md: { container: 'px-md py-sm rounded-md', label: 'text-md' },
  lg: { container: 'px-lg py-md rounded-lg', label: 'text-lg' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
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
