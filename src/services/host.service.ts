import { RoomModel } from "@models/room.model";
import { GameService } from "@services/game.service";
import { ERROR_CODES, RoomClient } from "@shared/types";
import { KnownError } from "@utils/KnownError";

export class HostService {
  static async makeRoomInactive({ hostId }: { hostId: RoomModel["hostId"] }) {
    const room = await RoomModel.findOne({
      where: { hostId },
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    await room.update({ isActive: false });
  }

  static async createRoom({
    hostId,
    lang,
  }: {
    hostId: RoomModel["hostId"];
    lang: "ru" | "en";
  }): Promise<{ room: RoomClient }> {
    const room = await RoomModel.create({ hostId, lang });

    return { room: await room.getFullInfo() };
  }

  static async reenterRoom({
    hostId,
  }: {
    hostId: RoomModel["hostId"];
  }): Promise<{ room: RoomClient }> {
    const room = await RoomModel.findOne({
      where: { hostId },
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    await room.update({ isActive: true });

    return { room: await room.getFullInfo() };
  }

  static async findRoom({
    hostId,
  }: {
    hostId: RoomModel["hostId"];
  }): Promise<{ room: RoomClient | null }> {
    const room = await RoomModel.findOne({ where: { hostId } });

    if (!room) {
      return { room: null };
    }
    return { room: await room.getFullInfo() };
  }

  static async startVoting({ hostId }: { hostId: RoomModel["hostId"] }) {
    const room = await RoomModel.findOne({
      where: { hostId },
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    await GameService.setNewFactForVoting({
      roomId: room.id,
    });
  }
}
