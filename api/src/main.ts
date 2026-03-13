import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './shared/presentation/http/api-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
