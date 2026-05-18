# Logging Guidelines

## Overview

DB logging should focus on lifecycle and failure visibility, not on raw records or query payloads.

## Log levels

- `info`: connection startup, migration runs, maintenance tasks.
- `warn`: retryable SQLite busy situations or soft consistency issues.
- `error`: failed migrations, unrecoverable connection or repository failures.

## Structured logging

- Include stable fields such as `workspaceId`, `repository`, and `operation` where useful.
- Keep payloads small.

## What to log

- migration start / finish
- repository failures
- maintenance actions such as cleanup or backup

## What not to log

- raw rows, secrets, or large blobs
- full SQL query strings unless needed for debugging and safe to retain
