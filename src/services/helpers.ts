import { PlayerModel } from "@models/player.model";
import { PlayerClient } from "@shared/types";

export const mapToPlayerClient = (playerEntity: PlayerModel): PlayerClient => {
  return {
    id: playerEntity.id,
    isVip: playerEntity.isVip,
    isActive: playerEntity.isActive,
    isFake: playerEntity.isFake,
    avatar: {
      token: playerEntity.avatarToken,
      isAutoSelected: playerEntity.isAvatarAutoSelected,
    },
    name: playerEntity.name,
    factStatus: playerEntity.factStatus,
  };
};
