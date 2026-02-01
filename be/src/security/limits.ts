export const limits = {
    balance: {
      limit: 5,
      windowMs: 60 * 1000, // 1 minute
    },
    transfer: {
      limit: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    global: {
      limit: 50,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  };
  