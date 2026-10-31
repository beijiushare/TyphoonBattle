/** 移动端点击开始后尝试进入全屏（iOS 不支持元素全屏，静默跳过） */
export function enterFullscreenIfMobile(): void {
  const isTouch = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  if (!isTouch) return;

  const root = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };

  const request = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root);
  if (!request) return;

  Promise.resolve(request())
    .then(() => {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      orientation.lock?.('landscape').catch(() => {});
    })
    .catch(() => {});
}
