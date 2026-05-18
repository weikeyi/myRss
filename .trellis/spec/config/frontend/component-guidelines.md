# Component Guidelines

## Overview

This package does not currently own UI components. If that changes, keep them small and configuration-specific.

## Props conventions

- Prefer explicit props over flexible bags.
- Reuse the typed config model if a control reflects env state.

## Accessibility

- If a config view is added, keep standard keyboard and form semantics intact.

## Common mistakes

- Building a config dashboard before there is an actual config UI requirement.
- Copying settings models into local component state without reason.
