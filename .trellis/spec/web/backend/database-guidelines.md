# Database Guidelines

## Overview

This package should not touch the database. Web-side helpers should consume shared contracts and server APIs only.

## Query patterns

- No query patterns belong here.

## Migrations

- No migrations belong here.

## Naming conventions

- Keep names API-oriented, not persistence-oriented.

## Common mistakes

- Smuggling repository logic into the web package.
