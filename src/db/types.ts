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

type DBVote = {
  [round: number]: DBPlayer["id"] | "NOBODY" | null;
};

export type DBFact = {
  id: string;
  playerId: string;
  text: string;
  supposedPlayer: DBPlayer | null;
  isGuessed: boolean;
  vote: DBVote;
};

export type DBCandidate = DBPlayer & { voteCount: number };

export type DBRoom = {
  code: string;
  status: ROOM_STATUSES;
  hostId: string;
  players: DBPlayer[];
  isInactive: boolean;
  round: number;
  facts: DBFact[];
  votingFact?: {
    id: string;
    text: string;
    candidates: DBCandidate[];
  };
};

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };
