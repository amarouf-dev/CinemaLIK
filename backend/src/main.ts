import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties sent by the client that are not explicitly defined in the DTO
      transform: true, // Automatically converts incoming network data to match the TypeScript types in your DTO (e.g., converting a string "5" to a number 5)
    }),
  );
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true, // only if you're using cookies/sessions
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
