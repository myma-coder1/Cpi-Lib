if (typeof window !== 'undefined') {
  const win = window as any;
  win.process = win.process || {};
  win.process.cwd = win.process.cwd || (() => '');
  win.process.env = win.process.env || {};
}
export {};
