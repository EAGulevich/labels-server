import { AvatarToken } from "./avatarTokens";
import { ROOM_STATUSES } from "./roomStatuses";

export type Player = {
  id: string;
  isVip: boolean;
  name: string;
  avatarToken: AvatarToken;
  isActive: boolean;
};

export type Room = {
  code: string;
  status: ROOM_STATUSES;
  hostId: string;
  players: Player[];
  isInactive: boolean;
};

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };
