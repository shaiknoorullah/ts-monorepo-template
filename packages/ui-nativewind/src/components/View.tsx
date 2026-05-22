// packages/ui-nativewind/src/components/View.tsx

import type { ViewProps as RNViewProps } from 'react-native'

import { View as RNView } from 'react-native'

export interface ViewProps extends RNViewProps {
  padded?: boolean
  surface?: ViewSurface
}

export type ViewSurface = 'default' | 'muted' | 'transparent'

const bg: Record<ViewSurface, string> = {
  default: 'bg-surface',
  muted: 'bg-surface-muted',
  transparent: 'bg-transparent',
}

export function View({
  children,
  className,
  padded,
  surface = 'transparent',
  ...rest
}: ViewProps): JSX.Element {
  return (
    <RNView className={`${bg[surface]} ${padded ? 'p-md' : ''} ${className ?? ''}`} {...rest}>
      {children}
    </RNView>
  )
}
