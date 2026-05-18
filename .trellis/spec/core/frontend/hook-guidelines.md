# Hook Guidelines

## Overview

This package does not currently own frontend hooks. If it ever does, keep them small and generic.

## Data fetching

- Do not add data fetching hooks here unless a UI surface appears.

## Naming conventions

- Use `use*` only for a real reusable concern.

## Common mistakes

- Creating hook abstractions before the package needs them.
