# Hook Guidelines

## Overview

This package does not currently own hooks. If it ever does, keep them admin-focused and small.

## Data fetching

- Do not add fetching hooks unless the package gains a UI consumer.

## Naming conventions

- Use `use*` only for a real reusable concern.

## Common mistakes

- Creating hook abstractions before the package needs them.
