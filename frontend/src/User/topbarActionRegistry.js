const actionHandlers = new Map();

export const registerTopbarActionHandler = (key, handler) => {
  if (!key) return;
  actionHandlers.set(key, handler);
};

export const unregisterTopbarActionHandler = (key) => {
  if (!key) return;
  actionHandlers.delete(key);
};

export const getTopbarActionHandler = (key) => {
  if (!key) return null;
  return actionHandlers.get(key) || null;
};
