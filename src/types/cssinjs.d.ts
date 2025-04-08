declare module "@ant-design/cssinjs" {
  export interface Cache {
    // 添加必要的属性
    [key: string]: any;
  }

  export function createCache(): Cache;
  export function extractStyle(cache: Cache): string;

  export interface StyleProviderProps {
    cache: Cache;
    children: React.ReactNode;
  }

  export function StyleProvider(props: StyleProviderProps): JSX.Element;
}
