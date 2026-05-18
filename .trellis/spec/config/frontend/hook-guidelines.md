# Hook Guidelines

## Overview

This package does not currently own frontend hooks. If hooks are added later, keep them small and config-specific.

## Data fetching

- Do not add fetching hooks here unless the package gains a real UI.

## Naming conventions

- Use `use*` only for a real reusable concern.

## Common mistakes

- Adding a hook layer before a second use case exists.
