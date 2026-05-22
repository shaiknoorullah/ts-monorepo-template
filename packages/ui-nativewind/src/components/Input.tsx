// packages/ui-nativewind/src/components/Input.tsx

import type { TextInputProps } from 'react-native'

import { TextInput } from 'react-native'

export interface InputProps extends TextInputProps {
  invalid?: boolean
}

export function Input({ className, invalid, ...rest }: InputProps): JSX.Element {
  return (
    <TextInput
      className={`bg-surface text-fg border rounded-md px-md py-sm text-md ${
        invalid ? 'border-danger' : 'border-border'
      } ${className ?? ''}`}
      placeholderTextColor="#8b949e"
      {...rest}
    />
  )
}
