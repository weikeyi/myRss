# Quality Guidelines

## Overview

Config code should be boring and deterministic. The current implementation uses `zod` defaults and no runtime side effects beyond reading env.

## Forbidden patterns

- Reading env in multiple places.
- Returning untyped config objects.
- Hiding default values in callers instead of the config package.
- Mixing config parsing with business logic.

## Required patterns

- Parse once in a single entry file.
- Export both the parsed value shape and the parser.
- Fail fast on invalid config.

## Testing requirements

- Config parsing should be covered with simple unit tests once the test harness exists.
- Default values should be explicit and stable.

## Code review checklist

- Are env values still centralized?
- Are defaults defined in the config package?
- Does the module stay side-effect free?
