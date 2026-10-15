export const errors = {
  generic: 'Something went wrong. Please try again.',
  network: "We couldn't reach the server. Check your connection and try again.",
  byStatus: {
    400: 'Please check the details and try again.',
    401: 'Your session has ended. Please sign in again.',
    403: "You don't have access to this.",
    404: "We couldn't find what you were looking for.",
    409: 'This conflicts with something that already exists.',
    429: 'Too many attempts. Please wait a little and try again.',
    500: 'The server ran into a problem. Please try again shortly.',
    502: 'We could not send the email. Please try again.',
  },
  boundary: {
    title: 'Something went wrong on this page',
    description: 'You can try again, or go back to the start.',
  },
  notFound: {
    title: 'Page not found',
    description: "The page you're looking for doesn't exist or has moved.",
    action: 'Go to the start',
  },
  forbidden: {
    title: 'No access',
    description: "Your account doesn't have permission to see this page.",
  },
  loadFailed: 'We could not load this.',
  metaFailed: {
    title: "We couldn't load the app",
    description: 'The server did not answer. Check that it is running, then try again.',
  },
}
