// 为 React 添加适当的类型定义
import React from 'react';

declare module 'react' {
  // 声明缺失的类型
  export declare function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export declare function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export declare function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export declare function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export declare function useRef<T>(initialValue: T): React.RefObject<T>;
  export declare function useContext<T>(context: React.Context<T>): T;
  
  // 为常见的 JSX 元素添加类型
  export namespace JSX {
    interface IntrinsicElements {
      a: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      div: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      p: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      // 其他必要的 HTML 元素...
    }
  }
}

// 修复组件类型定义
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
  }
} 