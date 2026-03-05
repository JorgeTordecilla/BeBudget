type SWTuple = [boolean, (value: boolean) => void];

export function useRegisterSW() {
  const noop = (_value: boolean) => undefined;
  const tuple: SWTuple = [false, noop];
  return {
    needRefresh: tuple,
    offlineReady: tuple,
    updateServiceWorker: async () => undefined
  };
}
