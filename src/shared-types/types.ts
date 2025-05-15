import { AvatarToken } from "./avatarTokens";

export type Player = {
  id: string;
  isVip: boolean;
  name: string;
  avatarToken: AvatarToken;
  // TODO: переименовать и убрать опциональность
  isPlayerInactive?: boolean;
};

export type Room = {
  code: string;
  // TODO enum + created -> lobby
  status: "CREATED";
  hostId: string;
  players: Player[];
  isInactive: boolean;
};

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };
