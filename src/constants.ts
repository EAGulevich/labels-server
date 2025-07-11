import { version } from "../package.json";

export const VERSION = "v" + version;

export const BOT_NAME = "Fake";

export const UNKNOWN_ROOM_CODE = "____";

/** Через какое время фейковый игрок отправит свой факт */
export const ADD_FAKE_FACT_TIMEOUT_MS = (4 + 3) * 1000;

/** Через какое время игра изменит свой статус при получении всех фактов */
export const AFTER_RECEIVING_ALL_FACTS_TIMEOUT_MS = 3 * 1000;

/** Задержка при получении всех голосов за факт */
export const AFTER_RECEIVING_ALL_VOTES_TIMEOUT_MS = 3 * 1000;
