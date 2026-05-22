// packages/forms/src/createForm.ts
//
// Thin wrapper around React Hook Form + Zod resolver. Consumers get a typed
// form API with a single options object.

import type { z } from 'zod'

import { zodResolver } from '@hookform/resolvers/zod'
import { type FieldValues, type SubmitHandler, useForm, type UseFormReturn } from 'react-hook-form'

// TODO: re-tighten — generic constraint widened to FieldValues to bridge zod 4
// `output<TSchema>` (= unknown) and react-hook-form's `FieldValues` constraint.
export interface CreateFormOptions<TValues extends FieldValues> {
  defaultValues?: Partial<TValues>
  onSubmit: SubmitHandler<TValues>
  schema: z.ZodTypeAny
}

export interface FormApi<TValues extends FieldValues> {
  form: UseFormReturn<TValues>
  handleSubmit: () => Promise<void>
}

export function createForm<TValues extends FieldValues>(
  opts: CreateFormOptions<TValues>,
): FormApi<TValues> {
  const form = useForm<TValues>({
    defaultValues: opts.defaultValues as never,
    resolver: zodResolver(opts.schema) as never,
  })

  const handleSubmit = async (): Promise<void> => {
    await form.handleSubmit(opts.onSubmit)()
  }

  return { form, handleSubmit }
}
