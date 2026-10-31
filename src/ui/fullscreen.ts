export function isTouchDevice(): boolean {
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}

export function isLandscape(): boolean {
  return window.innerWidth >= window.innerHeight;
}

/** 移动端请求全屏；桌面或失败返回 false */
export async function enterFullscreen(): Promise<boolean> {
  if (!isTouchDevice()) return false;
  if (document.fullscreenElement) return true;

  const root = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  const request = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root);
  if (!request) return false;

  try {
    await Promise.resolve(request());
    return true;
  } catch {
    return false;
  }
}

/** 尝试锁定横屏（需要全屏；iOS 不支持） */
export async function lockLandscape(): Promise<boolean> {
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (o: string) => Promise<void>;
  };
  if (!orientation?.lock) return false;
  try {
    await orientation.lock('landscape');
    return true;
  } catch {
    return false;
  }
}
