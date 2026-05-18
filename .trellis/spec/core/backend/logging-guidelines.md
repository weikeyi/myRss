# Logging Guidelines

## Overview

Core code should not log. Logging belongs in the application shells that use the core package.

## Log levels

- No log levels apply here.

## Structured logging

- Do not introduce logger dependencies in core.

## What to log

- Nothing from core itself.

## What not to log

- Anything. If you think it needs logging, move the logging to the server or worker layer.
