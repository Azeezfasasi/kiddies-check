'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// swagger-ui-react touches `window` on import, so it must only load in the browser.
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <p style={{ padding: 24 }}>Loading API docs…</p>,
});

export default function ApiDocs() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <SwaggerUI
        url="/swagger.json"
        docExpansion="list"
        defaultModelsExpandDepth={-1}
        persistAuthorization
        tryItOutEnabled
      />
    </div>
  );
}
