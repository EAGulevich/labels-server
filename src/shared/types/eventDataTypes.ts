import {
  AvatarToken,
  BotAvatarToken,
  ERROR_CODES,
  FACT_STATUSES,
  ROOM_STATUSES,
} from "@shared/types";

export interface ErrModel {
  enumCode: ERROR_CODES;
  description: string;
}

export type PlayerClient = {
  id: string;
  name: string;
  isVip: boolean;
  isActive: boolean;
  isFake: boolean;
  factStatus: FACT_STATUSES;
  avatar: {
    token: AvatarToken | BotAvatarToken;
    isAutoSelected: boolean;
  };
};

export type FactClient = {
  id: number;
  text: string;
  selectedPlayer: Pick<PlayerClient, "id" | "name" | "avatar"> | null;
  isCorrect: boolean;
};

export type VotingDataItem = {
  currentVotingFact: {
    id: number;
    text: string;
  };
  playersWhoVotedIds: string[];
  candidates: {
    candidate: Pick<PlayerClient, "id" | "name" | "avatar">;
    votesCount: number;
  }[];
  prevSteps: {
    fact: Pick<FactClient, "id" | "text">;
    selectedPlayer: Pick<PlayerClient, "id" | "name" | "avatar"> | null;
  }[];
};

export type Results = {
  [round: number]: {
    fact: {
      id: number;
      text: string;
      author: Pick<PlayerClient, "id" | "name" | "avatar">;
    };
    /** Отгадано в этом раунде */
    isGuessed: boolean;
    /** Игроки, верно проголосовавшие */
    playersWhoGuessedCorrectly: Pick<PlayerClient, "id" | "name" | "avatar">[];
  }[];
};

export type RoomClientBase = {
  code: string;
  isActive: boolean;
  currentRound: number;
  players: PlayerClient[];
  facts: FactClient[];
  hostId: string;
};

export type RoomClient = RoomClientBase &
  (
    | {
        status: ROOM_STATUSES.RESULTS;
        results: Results;
        votingData: null;
      }
    | {
        status: Exclude<ROOM_STATUSES, ROOM_STATUSES.RESULTS>;
        results: null;
        votingData: VotingDataItem | null;
      }
  );
