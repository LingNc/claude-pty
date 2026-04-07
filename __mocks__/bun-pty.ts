// Mock for bun-pty module
export const spawn = jest.fn();
export const Terminal = jest.fn();
export type IPty = {
  pid: number;
  write: (data: string) => void;
  kill: () => void;
  resize: (cols: number, rows: number) => void;
  onData: (callback: (data: string) => void) => void;
  onExit: (callback: (code: number) => void) => void;
};
