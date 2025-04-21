import express, { Express, Request, Response } from 'express';
import cors from 'cors';

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

  return app;
};
