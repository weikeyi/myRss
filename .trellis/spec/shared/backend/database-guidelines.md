# Database Guidelines

## Overview

Shared code should not depend on the database. If a schema or constant needs persistence support, the DB package should adapt to it.

## Query patterns

- No query patterns belong here.

## Migrations

- No migrations belong here.

## Naming conventions

- Keep names contract-oriented, not database-oriented.

## Common mistakes

- Copying persistence details into shared contracts.
- Making shared code aware of database state.
