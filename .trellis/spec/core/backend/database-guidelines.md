# Database Guidelines

## Overview

Core code should not touch the database. The package exists to keep workflow and domain logic independent from persistence.

## Query patterns

- No query patterns belong here.
- If a function needs a DB call, it belongs in a repository or service layer.

## Migrations

- No migrations belong here.

## Naming conventions

- Use domain names, not persistence names.

## Common mistakes

- Sneaking ORM helpers into the core package.
- Letting persistence concerns leak into pure domain rules.
