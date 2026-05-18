# Hook Guidelines

## Overview

This package does not currently own hooks. If hooks are added later, keep them small and contract-focused.

## Data fetching

- Do not add fetching hooks here unless the package has a UI consumer.

## Naming conventions

- Use `use*` only for a real reusable concern.

## Common mistakes

- Creating hook abstractions before the package needs them.
