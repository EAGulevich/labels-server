import { ERROR_CODES } from "@shared/types";

export class KnownError extends Error {
  public enumCode: ERROR_CODES;
  public description: string;

  constructor({ enumCode, msg }: { enumCode: ERROR_CODES; msg?: string }) {
    super(enumCode);
    this.enumCode = enumCode;

    switch (enumCode) {
      case ERROR_CODES.SERVER_ERROR: {
        this.description = "Что-то пошло не так";
        break;
      }
      case ERROR_CODES.ROOM_NOT_FOUND: {
        this.description = "Комната не найдена";
        break;
      }
      case ERROR_CODES.PLAYER_NOT_FOUND: {
        this.description = "Игрок не найден";
        break;
      }
      case ERROR_CODES.FACT_NOT_FOUND: {
        this.description = "Факт не найден";
        break;
      }
      case ERROR_CODES.GAME_ALREADY_STARTED: {
        this.description = "Игра в комнате уже началась";
        break;
      }
      case ERROR_CODES.NOT_ENOUGH_PLAYERS: {
        this.description = "Недостаточно игроков";
        break;
      }
      case ERROR_CODES.ROOM_AT_MAX_CAPACITY: {
        this.description = "Максимальное количество игроков в комнате";
        break;
      }
      case ERROR_CODES.PLAYER_NAME_ALREADY_EXISTS: {
        this.description = "Игрок уже присоединился к комнате";
        break;
      }
      case ERROR_CODES.PLAYER_NAME_TOO_LONG: {
        this.description = "Имя игрока слишком короткое";
        break;
      }
      case ERROR_CODES.PLAYER_NAME_TOO_SHORT: {
        this.description = "Имя игрока слишком длинное";
        break;
      }
      case ERROR_CODES.AVATAR_ALREADY_TAKEN: {
        this.description = "Аватар уже занят другим игроком";
        break;
      }
      case ERROR_CODES.PLAYER_ALREADY_SUBMITTED_FACT: {
        this.description = "Игрок уже отправил свой факт";
        break;
      }
      case ERROR_CODES.DUPLICATE_FACT: {
        this.description = "Дублирование факта";
        break;
      }
      case ERROR_CODES.FACT_TEXT_TOO_LONG: {
        this.description = "Недостаточная длина текста факта";
        break;
      }
      case ERROR_CODES.FACT_TEXT_TOO_SHORT: {
        this.description = "Длина текста факта превышает лимит";
        break;
      }

      case ERROR_CODES.VOTING_PHASE_NOT_ACTIVE: {
        this.description = `В игре еще не назначен факт для голосования`;
        break;
      }

      case ERROR_CODES.WRONG_FACT_VOTING: {
        this.description = `Попытка проголосовать не за текущий факт в голосовании`;
        break;
      }

      case ERROR_CODES.VOTING_DATA_NOT_FOUND: {
        this.description = `Данные для голосования не найдены`;
        break;
      }

      case ERROR_CODES.GAME_RESULTS_NOT_FOUND: {
        this.description = `Результаты игры не найдены`;
        break;
      }

      case ERROR_CODES.ALREADY_VOTED_FOR_FACT_IN_CURRENT_ROUND: {
        this.description = `Игроку нельзя голосовать дважды за один и тот же факт в одном раунде`;
        break;
      }
    }

    if (msg) {
      this.description = this.description + ": " + msg;
    }
  }
}
