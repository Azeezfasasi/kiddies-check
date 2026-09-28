// swagger-ui-react ships without TypeScript types. This covers the props used
// by src/app/doc/page.tsx; swap for @types/swagger-ui-react if more are needed.
declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  export interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    persistAuthorization?: boolean;
    tryItOutEnabled?: boolean;
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
