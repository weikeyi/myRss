# Hook Guidelines

## Overview

This package does not currently own hooks. If it ever does, keep them server-admin only and small.

## Data fetching

- Do not add fetching hooks unless the package gains a UI consumer.

## Naming conventions

- Use `use*` only for a real reusable concern.

## Common mistakes

- Building a hook layer before there is an actual server-side UI use case.
