# @pkg/forms

Form helpers. RHF + Zod for interactive forms; Conform for progressive-enhancement (Astro server forms).

## Quick start

```ts
import { createForm } from '@pkg/forms'
import { z } from 'zod'

const Schema = z.object({ name: z.string().min(1), email: z.string().email() })

function MyForm() {
  const { form, handleSubmit } = createForm({
    schema: Schema,
    onSubmit: (values) => api.submit(values),
  })
  // ... render with form.register / form.formState.errors
}
```

See `docs/specs/frontend/frontend-package-architecture.md`.
