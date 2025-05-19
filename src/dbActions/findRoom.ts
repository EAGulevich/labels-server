import { DB_HOSTS } from "../db/hosts";
import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

type FindRoomProps = {
  findBy: "hostId" | "playerId" | "roomCode";
  value: string;
};

export const findRoom = ({
  findBy,
  value,
}: FindRoomProps): DeepReadonly<DBRoom> | undefined => {
  switch (findBy) {
    case "hostId": {
      const roomCode = DB_HOSTS[value];
      return DB_ROOMS[roomCode || ""];
    }
    case "playerId": {
      const roomCode = DB_PLAYERS[value];
      return DB_ROOMS[roomCode || ""];
    }
    case "roomCode": {
      return Object.values(DB_ROOMS).find((room) => room?.code === value);
    }
  }
};
