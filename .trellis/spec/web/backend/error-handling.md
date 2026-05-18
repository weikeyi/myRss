# Error Handling

## Overview

Web-side helpers should translate server responses, not invent their own error taxonomy.

## Error types

- API/network errors from the server boundary.
- Validation errors from the web form boundary, if any helpers appear.

## Error handling patterns

- Keep server response parsing close to the API helper.
- Avoid hiding useful error detail from the page layer.

## API error responses

- Follow the server response shape, do not invent a second one in the web package.

## Common mistakes

- Rewriting server errors in a generic wrapper that loses context.
