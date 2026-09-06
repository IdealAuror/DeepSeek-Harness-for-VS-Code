/**
 * 防御性护栏:在第三方库初始化前禁用 ServiceWorker 注册。
 *
 * VS Code Webview 环境禁止 ServiceWorker 注册(平台层用它自身的方式服务资源);
 * 任何库若尝试 navigator.serviceWorker.register() 会触发
 * "InvalidStateError: Failed to register a ServiceWorker" 并导致整个视图加载失败。
 * 本模块必须先于其他依赖导入执行。
 *
 * 注意:本护栏只覆盖扩展内容(内层 iframe)里第三方库的尝试。
 * 报错 "Error loading webview: Could not register service worker: InvalidStateError..."
 * 来自 VS Code 平台自己的 webview 预载页(src/vs/workbench/contrib/webview/browser/pre/index.html),
 * 发生在扩展内容加载之前,本护栏无法拦截;该类失败由宿主侧的 boot 守护自动恢复
 * (见 channel.ts 的 ChatSink.onBootFailed),平台问题见 microsoft/vscode#125993。
 */
(function installServiceWorkerGuard() {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const guard = {
        register: () => Promise.reject(new Error("ServiceWorker registration is disabled inside the VS Code webview")),
        getRegistration: () => Promise.resolve(undefined),
        getRegistrations: () => Promise.resolve([]),
        ready: new Promise<never>(() => {}),
        controller: undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      };
      try {
        Object.defineProperty(navigator, "serviceWorker", { value: guard, configurable: false });
      } catch {
        // 属性不可覆盖时忽略(环境本身不会触发注册)
      }
    }
  } catch {
    // 永不抛出
  }
})();
