# Logging Guidelines

## Overview

Web-side helpers should avoid logging unless they are explicitly handling client-side diagnostics.

## Log levels

- No package-level logging policy exists yet.

## Structured logging

- Do not add logger dependencies here by default.

## What to log

- Nothing unless a future helper truly needs diagnostic output.

## What not to log

- API keys, cookies, private content, or request payloads.
