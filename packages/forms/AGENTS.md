# AGENTS.md — packages/forms

1. **All schemas are Zod.** No Yup, no Joi.
2. **No business validation here.** Common schemas (email, phone, URL) only. Tenant-specific schemas live in apps.
3. **Conform helpers go under `src/conform/`.** Don't mix RHF and Conform code paths.
