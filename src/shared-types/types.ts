import { FACT_STATUS } from "@sharedTypes/factStatuses";

import { AvatarToken, AvatarTokenBot } from "./avatarTokens";
import { ROOM_STATUSES } from "./roomStatuses";

export type Player = {
  id: string;
  isVip: boolean;
  name: string;
  avatarToken: AvatarToken | AvatarTokenBot;
  isActive: boolean;
  factStatus: FACT_STATUS;
  isFake: boolean;
};

export type Vote = {
  [round: number]: Player["id"] | "NOBODY" | null;
};

export type Fact = {
  id: string;
  text: string;
  supposedPlayer: Player | null;
  isGuessed: boolean;
  vote: Vote;
};

export type Candidate = Player & { voteCount: number };

export type Room = {
  code: string;
  status: ROOM_STATUSES;
  hostId: string;
  players: Player[];
  isInactive: boolean;
  round: number;
  facts: Fact[];
  votingFact?: {
    id: string;
    text: string;
    candidates: Candidate[];
  };
};
