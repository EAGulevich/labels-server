import { Request, Response, Router } from 'express';
import { db } from '../db/in-memory.db';
import { HttpStatus } from '../core/types/http-statuses';
import { AvailableResolutions, Video } from './types/video';
import { ValidationError } from '../drivers/types/validationError';
import { createErrorMessages } from '../core/utils/error.utils';

export const videosRouter = Router({});

videosRouter
  .get('', (req: Request, res: Response) => {
    res.status(200).send(db.videos);
  })

  .get('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const video = db.videos.find((v) => v.id === id);

    if (!video) {
      res.sendStatus(HttpStatus.NotFound);
      return;
    }
    res.status(200).send(video);
  })

  .post(
    '',
    (
      req: Request<
        {},
        {},
        Pick<Video, 'title' | 'author' | 'availableResolutions'>
      >,
      res: Response,
    ) => {
      const errors: ValidationError[] = [];
      const body = req.body;
      if (
        !body.title ||
        typeof body.title !== 'string' ||
        body.title.length > 40
      ) {
        errors.push({
          field: 'title',
          message: 'Must be string and max length 40',
        });
      }

      if (
        !body.author ||
        typeof body.author !== 'string' ||
        body.author.length > 20
      ) {
        errors.push({
          field: 'author',
          message: 'Must be string and max length 20',
        });
      }

      if (
        !body.availableResolutions ||
        !Array.isArray(body.availableResolutions) ||
        !body.availableResolutions.length ||
        !body.availableResolutions.filter((value) =>
          Object.values(AvailableResolutions).includes(value),
        )
      ) {
        errors.push({
          field: 'availableResolutions',
          message:
            'Must be At least one resolution should be added: [ P144, P240, P360, P480, P720, P1080, P1440, P2160 ]\n' +
            ']',
        });
      }

      if (errors.length > 0) {
        res.status(HttpStatus.BadRequest).send(createErrorMessages(errors));
        return;
      }

      const newVideo: Video = {
        id: db.videos.length ? db.videos[db.videos.length - 1].id + 1 : 1,
        title: req.body.title,
        availableResolutions: req.body.availableResolutions,
        author: req.body.author,
        createdAt: new Date(),
        publicationDate: new Date(), // TODO: +1 day
        canBeDownloaded: false,
        minAgeRestriction: null,
      };

      db.videos.push(newVideo);

      res.status(HttpStatus.Created).send(newVideo);
    },
  )

  .put('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const index = db.videos.findIndex((v) => v.id === id);

    if (index === -1) {
      res.status(HttpStatus.NotFound);
      return;
    }

    const errors: ValidationError[] = [];
    const body = req.body;
    if (
      !body.title ||
      typeof body.title !== 'string' ||
      body.title.length > 40
    ) {
      errors.push({
        field: 'title',
        message: 'Must be string and max length 40',
      });
    }

    if (
      !body.author ||
      typeof body.author !== 'string' ||
      body.author.length > 20
    ) {
      errors.push({
        field: 'author',
        message: 'Must be string and max length 20',
      });
    }

    if (!body.canBeDownloaded || typeof body.canBeDownloaded !== 'boolean') {
      errors.push({
        field: 'canBeDownloaded',
        message: 'Must be boolean',
      });
    }

    if (!body.publicationDate || typeof body.publicationDate !== 'string') {
      errors.push({
        field: 'publicationDate',
        message: 'Must be date string',
      });
    }

    if (
      !body.availableResolutions ||
      !Array.isArray(body.availableResolutions) ||
      !body.availableResolutions.length ||
      !body.availableResolutions.filter((value: any) =>
        Object.values(AvailableResolutions).includes(value),
      )
    ) {
      errors.push({
        field: 'availableResolutions',
        message:
          'Must be At least one resolution should be added: [ P144, P240, P360, P480, P720, P1080, P1440, P2160 ]\n' +
          ']',
      });
    }

    if (errors.length > 0) {
      res.status(HttpStatus.BadRequest).send(createErrorMessages(errors));
      return;
    }

    const video = db.videos[index];

    video.title = req.body.title;
    video.author = req.body.author;
    video.availableResolutions = req.body.availableResolutions;
    video.canBeDownloaded = req.body.canBeDownloaded;
    video.minAgeRestriction = req.body.minAgeRestriction;
    video.publicationDate = req.body.publicationDate;

    res.sendStatus(HttpStatus.NoContent);
  })

  .delete('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    //ищет первый элемент, у которого функция внутри возвращает true и возвращает индекс этого элемента в массиве, если id ни у кого не совпал, то findIndex вернёт -1.
    const index = db.videos.findIndex((v) => v.id === id);

    if (index === -1) {
      res.status(HttpStatus.NotFound).send({ asdf: 232 });

      return;
    }

    db.videos.splice(index, 1);
    res.sendStatus(HttpStatus.NoContent);
  });
