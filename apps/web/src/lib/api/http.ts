export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}
