# OG image Worker — static assets

Drop `Inter-Bold.otf` (or any preferred weight) here before deploying.

```bash
curl -L \
  https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip \
  -o /tmp/inter.zip
unzip -j /tmp/inter.zip 'extras/otf/Inter-Bold.otf' -d ./
```

`wrangler.toml` binds this directory at `env.ASSETS` so the Worker can
fetch the font on first request and cache the `ArrayBuffer` in module
scope for the rest of the isolate's life.
