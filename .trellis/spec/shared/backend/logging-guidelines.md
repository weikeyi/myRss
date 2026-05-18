# Logging Guidelines

## Overview

Shared contract code should not log. It should remain safe to import from any layer.

## Log levels

- No logging levels apply in shared code.

## Structured logging

- Do not add logger dependencies to shared contracts.

## What to log

- Nothing from the shared package itself.

## What not to log

- Anything. Logging belongs in the app shell, not in shared schemas or constants.
