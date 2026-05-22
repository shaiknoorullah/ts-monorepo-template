// packages/ui-nativewind/src/components/Input.tsx

import { TextInput } from 'react-native'
import type { TextInputProps } from 'react-native'

export interface InputProps extends TextInputProps {
  invalid?: boolean
}

export function Input({ invalid, className, ...rest }: InputProps): JSX.Element {
  return (
    <TextInput
      placeholderTextColor="#8b949e"
      className={`bg-surface text-fg border rounded-md px-md py-sm text-md ${
        invalid ? 'border-danger' : 'border-border'
      } ${className ?? ''}`}
      {...rest}
    />
  )
}
