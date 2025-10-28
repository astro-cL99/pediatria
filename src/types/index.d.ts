// Tipos globales para la aplicación

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// Tipos para las imágenes
interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

declare module '*.png' {
  const content: StaticImageData;
  export default content;
}

declare module '*.jpg' {
  const content: StaticImageData;
  export default content;
}

declare module '*.jpeg' {
  const content: StaticImageData;
  export default content;
}

declare module '*.gif' {
  const content: StaticImageData;
  export default content;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}

// Tipos para los módulos de CSS
interface CSSModuleClasses {
  [key: string]: string;
}

// Tipos para las variables de entorno
type Env = {
  NEXT_PUBLIC_API_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
};

declare namespace NodeJS {
  interface ProcessEnv extends Env {}
}
