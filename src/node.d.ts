// The project has no dependencies, so @types/node is not installed. These are
// the only pieces of the Node API the CLI touches.
declare module 'fs' {
  export function readFileSync(path: string | number, encoding: 'utf8'): string;
}

declare const process: {
  argv: string[];
  exitCode?: number;
  stdout: { write(text: string): boolean };
  stderr: { write(text: string): boolean };
};

declare const require: { main: unknown };
declare const module: unknown;
