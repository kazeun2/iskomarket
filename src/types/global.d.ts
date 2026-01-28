declare module 'sonner' {
  export const toast: any;
  export function Toaster(props: any): any;
  export type ToasterProps = any;
  export default toast;
}

declare module 'figma:*' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react' {
  const React: any;
  export default React;

  // Hooks (common ones used in the project)
  export function useState<S>(initialState?: S | (() => S)):
    [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T = any>(initial?: T): { current: T };
  export function useContext<T = any>(ctx: any): T;
  export function useId(): string;
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T;
  export function useMemo<T>(fn: () => T, deps: any[]): T;

  // createContext
  export function createContext<T = any>(defaultValue?: T): {
    Provider: any;
    Consumer: any;
    defaultValue: T;
  };

  // forwardRef / ElementRef
  export function forwardRef<T, P = {}>(render: (props: P, ref: any) => any): any;
  export type ElementRef<C> = any;

  // JSX helpers
  export const Fragment: any;
  export const Children: any;

  // Component prop helpers used in the project
  export type ComponentProps<T> = any;
  export type ComponentPropsWithoutRef<T> = any;
  export type ComponentPropsWithRef<T> = any;

  // Common React types used across the codebase
  export type ReactNode = any;
  export type ReactElement = any;
  export type MouseEvent = any;
  export type FormEvent = any;
  export type ChangeEvent<T = any> = any;
  export type ComponentType<P = any> = any;
  export type ErrorInfo = any;
  export type CSSProperties = any;
  export type KeyboardEvent<T = any> = any;
  export interface ImgHTMLAttributes<T> { [key: string]: any }
}

declare namespace React {
  // Ensure `React.*` namespace types exist for files referencing them
  type ChangeEvent<T = any> = any;
  type KeyboardEvent<T = any> = any;
  interface ImgHTMLAttributes<T = any> { [key: string]: any }
  type FormEvent = any;
  type ComponentType<P = any> = any;
  type ErrorInfo = any;
  type CSSProperties = any;
  type ReactNode = any;
  type ComponentProps<T> = any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface ImportMeta {
  env: Record<string, any>
}
