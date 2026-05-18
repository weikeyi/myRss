# Directory Structure

## Overview

This package does not currently own frontend code. If a UI layer is added later, keep it thin and only for configuration-specific views.

## Module organization

- Do not add app pages or feature state here.
- Reuse backend config types instead of redefining them.

## Naming conventions

- If UI ever appears, keep names explicit and config-specific.

## Examples

- [packages/config/src/index.ts](../../../packages/config/src/index.ts)
