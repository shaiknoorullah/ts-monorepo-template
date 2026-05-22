# @pkg/seo

OpenGraph + JSON-LD (schema.org) builders.

```ts
import { buildOpenGraph, jsonld } from '@pkg/seo'

const og = buildOpenGraph({ title, description, url })
const org = jsonld.organization({ name, url, logo })
```
