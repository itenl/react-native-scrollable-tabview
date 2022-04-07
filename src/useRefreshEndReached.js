export const onceMap = new Map();
export const refreshMap = new Map();
export const endReachedhMap = new Map();

export const initScreen = screen => {
  if (onceMap.has(screen)) {
    const getRef = onceMap.get(screen);
    getRef && getRef(screen);
    onceMap.delete(screen);
  }
};

export const triggerOnce = (screen, getRef) => {
  if (!onceMap.has(screen)) {
    onceMap.set(screen, getRef);
  }
};

export const onRefresh = (screen, callback) => {
  if (!refreshMap.has(screen)) {
    refreshMap.set(screen, callback);
  }
};

export const triggerRefresh = (screen, toggled) => {
  if (refreshMap.has(screen)) {
    const callback = refreshMap.get(screen);
    callback && callback(toggled);
  }
};

export const onEndReached = (screen, callback) => {
  if (!endReachedhMap.has(screen)) {
    endReachedhMap.set(screen, callback);
  }
};

export const triggerEndReached = screen => {
  if (endReachedhMap.has(screen)) {
    const callback = endReachedhMap.get(screen);
    callback && callback();
  }
};
