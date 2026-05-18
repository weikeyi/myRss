# State Management

## Overview

This package does not currently own frontend state. If it ever does, keep the state limited to configuration UI only.

## State categories

- Prefer local state for any future forms.
- Do not add global state here unless multiple config views need it.

## Common mistakes

- Creating a store before there is a second consumer.
