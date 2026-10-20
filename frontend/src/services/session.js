let version = 0;
export const getSessionVersion = () => version;
export const advanceSession = () => { version += 1; };
