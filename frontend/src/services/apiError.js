/**
 * Extract a safe, human-readable message from an Axios error. Never falls
 * back to stringifying the whole error object (that used to leak
 * "AxiosError: Request failed with status code 400" straight to users).
 */
export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) return fallback;

  const serverMessage = error.response?.data?.message;
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage;
  }

  if (!error.response) {
    // Network error, timeout, CORS block, request cancelled, etc.
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export default getErrorMessage;
