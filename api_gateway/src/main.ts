// api-gateway/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // /auth
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://auth_server:3000',
      changeOrigin: true,
      pathRewrite: { '^/auth': '' },
    }),
  );

  // /event → service2
  app.use(
    '/event',
    createProxyMiddleware({
      target: 'http://evnet_server:3000',
      changeOrigin: true,
      pathRewrite: { '^/event': '' },
    }),
  );

  await app.listen(3000);
}
bootstrap();
