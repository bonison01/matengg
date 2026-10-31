import { Middleware, MiddlewareAPI, AnyAction } from '@reduxjs/toolkit';

const localStorageMiddleware: Middleware = (storeAPI: MiddlewareAPI) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (next) => (action: unknown) => {
    const result = next(action);

    if (typeof action === 'object' && action !== null && 'type' in action && typeof action.type === 'string') {
      if (action.type.startsWith('cart/')) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const state = storeAPI.getState().cart;
          localStorage.setItem('cart', JSON.stringify(state));
        }, 300);
      }
    }

    return result;
  };
};

export default localStorageMiddleware;
