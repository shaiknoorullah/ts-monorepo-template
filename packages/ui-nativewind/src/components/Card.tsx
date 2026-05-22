// packages/ui-nativewind/src/components/Card.tsx

import type { ViewProps } from 'react-native'

import { View } from 'react-native'

export interface CardProps extends ViewProps {
  elevated?: boolean
}

export function Card({ children, className, elevated, ...rest }: CardProps): JSX.Element {
  return (
    <View
      className={`bg-surface border border-border rounded-md p-md ${
        elevated ? 'shadow-md' : ''
      } ${className ?? ''}`}
      {...rest}
    >
      {children}
    </View>
  )
}
