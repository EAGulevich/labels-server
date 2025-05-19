import { DBRoom } from "./types";

/**  Все комнаты roomCode: Room */
export const DB_ROOMS: { [roomCode: DBRoom["code"]]: DBRoom | undefined } = {};
