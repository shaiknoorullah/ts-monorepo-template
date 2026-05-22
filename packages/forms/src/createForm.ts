// packages/forms/src/createForm.ts
//
// Thin wrapper around React Hook Form + Zod resolver. Consumers get a typed
// form API with a single options object.

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler, type UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'

export interface CreateFormOptions<TSchema extends z.ZodTypeAny> {
  schema: TSchema
  defaultValues?: Partial<z.infer<TSchema>>
  onSubmit: SubmitHandler<z.infer<TSchema>>
}

export interface FormApi<TSchema extends z.ZodTypeAny> {
  form: UseFormReturn<z.infer<TSchema>>
  handleSubmit: () => Promise<void>
}

export function createForm<TSchema extends z.ZodTypeAny>(
  opts: CreateFormOptions<TSchema>,
): FormApi<TSchema> {
  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(opts.schema),
    defaultValues: opts.defaultValues as z.infer<TSchema> | undefined,
  })

  const handleSubmit = async (): Promise<void> => {
    await form.handleSubmit(opts.onSubmit)()
  }

  return { form, handleSubmit }
}
