import { Room } from "@sharedTypes/types";

/**  Все комнаты roomCode: Room */
export const DB_ROOMS: { [roomCode: Room["code"]]: Room | undefined } = {};

