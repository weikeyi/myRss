# Logging Guidelines

## Overview

Logging should be structured and sparse. This is a personal app, so logs should help trace jobs, syncs, and failures without exposing content or secrets.

## Log levels

- `info`: startup, sync lifecycle, job lifecycle, successful state changes.
- `warn`: recoverable failures, retries, soft validation issues.
- `error`: unexpected exceptions or final failures.
- `debug`: noisy polling or internal diagnostics safe to omit in normal runs.

## Structured logging

- Prefer stable fields such as `workspaceId`, `jobId`, `articleId`, `feedId`, `stepName`.
- Keep message text short and machine-friendly.

## What to log

- job claimed / completed / retried
- pipeline step transitions
- feed sync start / finish / failure
- config bootstrap failures

## What not to log

- API keys, cookies, raw HTML, full article bodies, or private feed content
- full request payloads when they may contain secrets
- anything that would be expensive or risky to retain long-term
