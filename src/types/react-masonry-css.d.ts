declare module 'react-masonry-css' {
  import { ReactNode } from 'react';
  
  interface MasonryProps {
    breakpointCols?: number | { [key: string]: number };
    className?: string;
    columnClassName?: string;
    children: ReactNode[];
  }
  
  const Masonry: React.FC<MasonryProps>;
  export default Masonry;
}
