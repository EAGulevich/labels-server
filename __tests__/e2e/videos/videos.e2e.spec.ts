import request from 'supertest';
import express from 'express';
import { setupApp } from '../../../src/setup-app';
import { HttpStatus } from '../../../src/core/types/http-statuses';
import { AvailableResolutions, Video } from '../../../src/videos/types/video';

describe('Video API', () => {
  const app = express();
  setupApp(app);

  beforeAll(async () => {
    await request(app)
      .delete('/api/testing/all-data')
      .expect(HttpStatus.NoContent);
  });

  it('should create video; POST /api/videos', async () => {
    const newVideo: Pick<Video, 'title' | 'author' | 'availableResolutions'> = {
      title: 'Some',
      author: 'Author',
      availableResolutions: [AvailableResolutions.P_144],
    };

    await request(app)
      .post('/api/videos')
      .send(newVideo)
      .expect(HttpStatus.Created);
  });

  it('should return videos list; GET /api/videos', async () => {
    const newVideo: Pick<Video, 'title' | 'author' | 'availableResolutions'> = {
      title: 'Some',
      author: 'Author',
      availableResolutions: [AvailableResolutions.P_144],
    };
    const newVideo2: Pick<Video, 'title' | 'author' | 'availableResolutions'> =
      {
        title: 'Some2',
        author: 'Author2',
        availableResolutions: [
          AvailableResolutions.P_480,
          AvailableResolutions.P_720,
        ],
      };
    await request(app)
      .post('/api/videos')
      .send({ ...newVideo })
      .expect(HttpStatus.Created);

    await request(app)
      .post('/api/videos')
      .send({ ...newVideo2 })
      .expect(HttpStatus.Created);

    const videosListResponse = await request(app)
      .get('/api/videos')
      .expect(HttpStatus.Ok);

    expect(videosListResponse.body).toBeInstanceOf(Array);
    expect(videosListResponse.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should return video by id; GET /api/videos/:id', async () => {
    const newVideo: Pick<Video, 'title' | 'author' | 'availableResolutions'> = {
      title: 'Some',
      author: 'Author',
      availableResolutions: [AvailableResolutions.P_144],
    };

    const createResponse = await request(app)
      .post('/api/videos')
      .send({ ...newVideo })
      .expect(HttpStatus.Created);

    const getResponse = await request(app)
      .get(`/api/videos/${createResponse.body.id}`)
      .expect(HttpStatus.Ok);

    expect(getResponse.body).toEqual({
      ...createResponse.body,
      id: expect.any(Number),
      createdAt: expect.any(String),
      publicationDate: expect.any(String),
      canBeDownloaded: false,
      minAgeRestriction: null,
    });
  });

  it('should update video; PUT /api/videos/:id', async () => {
    const newVideo: Pick<Video, 'title' | 'author' | 'availableResolutions'> = {
      title: 'Some',
      author: 'Author',
      availableResolutions: [AvailableResolutions.P_144],
    };

    const createResponse = await request(app)
      .post('/api/videos')
      .send({ ...newVideo })
      .expect(HttpStatus.Created);

    const videoUpdateData: Pick<
      Video,
      | 'title'
      | 'author'
      | 'availableResolutions'
      | 'canBeDownloaded'
      | 'minAgeRestriction'
      | 'publicationDate'
    > = {
      title: 'string',
      author: 'string',
      availableResolutions: [AvailableResolutions.P_2160],
      canBeDownloaded: true,
      minAgeRestriction: 18,
      publicationDate: new Date(),
    };

    await request(app)
      .put(`/api/videos/${createResponse.body.id}`)
      .send(videoUpdateData)
      .expect(HttpStatus.NoContent);

    const videoResponse = await request(app).get(
      `/api/videos/${createResponse.body.id}`,
    );

    expect(videoResponse.body).toEqual({
      ...videoUpdateData,
      id: createResponse.body.id,
      createdAt: expect.any(String),
      publicationDate: expect.any(String),
    });
  });

  it('DELETE /api/videos/:id and check after NOT FOUND', async () => {
    const newVideo: Pick<Video, 'title' | 'author' | 'availableResolutions'> = {
      title: 'Some',
      author: 'Author',
      availableResolutions: [AvailableResolutions.P_144],
    };

    const {
      body: { id: createdVideoId },
    } = await request(app)
      .post('/api/videos')
      .send({ ...newVideo })
      .expect(HttpStatus.Created);

    await request(app)
      .delete(`/api/videos/${createdVideoId}`)
      .expect(HttpStatus.NoContent);

    const videoResponse = await request(app).get(
      `/api/videos/${createdVideoId}`,
    );
    expect(videoResponse.status).toBe(HttpStatus.NotFound);
  });
});
