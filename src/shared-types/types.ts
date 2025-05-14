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

export type ReadonlyPlayer = Readonly<
  Pick<Player, "id" | "name" | "isVip" | "avatarToken" | "isPlayerInactive">
>;

export type ReadonlyRoom = Readonly<
  Pick<Room, "isInactive" | "hostId" | "status" | "code">
> & { players: Readonly<ReadonlyPlayer[]> };
