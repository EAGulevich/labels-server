import express, { Express, Request, Response } from 'express';
import { driversRouter } from './drivers/routers/drivers.router';
import { testingRouter } from './testing/routers/testing.router';
import { setupSwagger } from './core/swagger/setup-swagger';
import cors from 'cors';
import { videosRouter } from './videos/router';

export const setupApp = (app: Express) => {
  app.use(express.json());

  app.use(
    cors({
      origin: [
        'http://localhost:8000',
        'http://localhost:4173',
        'https://game-labels.vercel.app',
        'https://game-labels-preview.vercel.app',
      ], // Разрешить запросы с этого домена
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Разрешить эти HTTP методы
      credentials: true, // Разрешить отправку куки и заголовков авторизации
    }),
  );

  app.get('/', (req: Request, res: Response) => {
    res.status(200).send('hello world!!!');
  });

  app.use('/api/drivers', driversRouter);
  app.use('/api/videos', videosRouter);
  app.use('/api/testing', testingRouter);

  setupSwagger(app);
  return app;
};
