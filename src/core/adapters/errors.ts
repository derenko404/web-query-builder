export const ERRORS = {
  DB_CONNECT() {
    return 'database connection is not available'
  },
  REQUEST_ERROR(message?: string) {
    return `failed to retrieve records: ${message || 'unknown error'}`
  },
  TRANSACTION_ERROR() {
    return 'transaction aborted'
  },
}
