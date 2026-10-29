/** Intentionally contains no upstream error, response, query or credentials. */
export class CatalogUnavailableError extends Error {
  constructor() {
    super("The product catalogue is temporarily unavailable.");
    this.name = "CatalogUnavailableError";
  }
}

export function isCatalogUnavailableError(error: unknown): error is CatalogUnavailableError {
  return error instanceof CatalogUnavailableError;
}
