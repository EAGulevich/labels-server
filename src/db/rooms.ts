import { Room } from '../shared-types/types';

export const DB_ROOMS: { [creatorSocketId: Room['code']]: Room } = {};
