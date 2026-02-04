export interface UseDeleteHandlerOptions {
  endpoint: (id: string) => string;
  successMessage: string;
  errorMessage?: string;
  invalidateQueries?: string[][];
}
