import { AvatarToken, AvatarTokenBot } from "@sharedTypes/avatarTokens";
import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";

export type DBPlayer = {
  id: string;
  isVip: boolean;
  name: string;
  avatarToken: AvatarToken | AvatarTokenBot;
  isActive: boolean;
  factStatus: FACT_STATUS;
  isFake: boolean;
};

export type DBFact = {
  playerId: string;
  text: string;
  isGuessed: boolean;
};

export type DBRoom = {
  code: string;
  status: ROOM_STATUSES;
  hostId: string;
  players: DBPlayer[];
  isInactive: boolean;
  facts: DBFact[];
};

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };
