import { FACT_STATUS } from "@sharedTypes/factStatuses";

import { AvatarToken } from "./avatarTokens";
import { ROOM_STATUSES } from "./roomStatuses";

export type Player = {
  id: string;
  isVip: boolean;
  name: string;
  avatarToken: AvatarToken;
  isActive: boolean;
  factStatus: FACT_STATUS;
};

export type Room = {
  code: string;
  status: ROOM_STATUSES;
  hostId: string;
  players: Player[];
  isInactive: boolean;
};
