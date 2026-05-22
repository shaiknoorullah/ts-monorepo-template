// packages/ui/src/hooks/useToast.ts
//
// Platform-agnostic toast API. The .web.ts variant uses sonner; the
// .native.ts variant uses Tamagui's Toast primitive. Bundlers resolve.

import { toast as sonner } from 'sonner'

export interface ToastApi {
  success: (message: string, opts?: { description?: string }) => void
  error: (message: string, opts?: { description?: string }) => void
  info: (message: string, opts?: { description?: string }) => void
}

export function useToast(): ToastApi {
  return {
    success: (m, opts) => sonner.success(m, opts),
    error: (m, opts) => sonner.error(m, opts),
    info: (m, opts) => sonner.info(m, opts),
  }
}
