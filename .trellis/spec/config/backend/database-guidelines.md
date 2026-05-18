# Database Guidelines

## Overview

This package should not touch the database. Its job is to provide runtime configuration, not persistence access.

## Query patterns

- No query patterns apply here.
- If code in this package starts talking to storage, that logic belongs elsewhere.

## Migrations

- No migration logic belongs in config.

## Naming conventions

- Keep names focused on config and environment concepts, not tables or records.

## Common mistakes

- Smuggling database defaults into env parsing.
- Importing ORM or repository code into config.
