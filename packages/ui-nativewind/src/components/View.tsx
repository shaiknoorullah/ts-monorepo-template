// packages/ui-nativewind/src/components/View.tsx

import { View as RNView } from 'react-native'
import type { ViewProps as RNViewProps } from 'react-native'

export type ViewSurface = 'default' | 'muted' | 'transparent'

export interface ViewProps extends RNViewProps {
  surface?: ViewSurface
  padded?: boolean
}

const bg: Record<ViewSurface, string> = {
  default: 'bg-surface',
  muted: 'bg-surface-muted',
  transparent: 'bg-transparent',
}

export function View({
  surface = 'transparent',
  padded,
  className,
  children,
  ...rest
}: ViewProps): JSX.Element {
  return (
    <RNView
      className={`${bg[surface]} ${padded ? 'p-md' : ''} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </RNView>
  )
}
