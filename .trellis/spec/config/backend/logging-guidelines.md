# Logging Guidelines

## Overview

Config loading should not emit noisy logs. If the app logs config-related events, they should be limited to startup diagnostics and never expose secrets.

## Log levels

- `info`: startup config summary if needed.
- `warn`: deprecated or missing optional settings.
- `error`: invalid configuration preventing startup.

## Structured logging

- Prefer stable fields such as `envName` or `configKey` when a setting fails validation.
- Keep any summary text short and operator-focused.

## What to log

- invalid config keys
- startup confirmation of config load
- missing optional settings that have a fallback

## What not to log

- full env dumps
- API keys, cookies, or secrets
- private path data unless required for debugging
