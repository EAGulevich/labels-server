import { ROOM_CODE_LENGTH } from '../constants';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const generateRoomCode = (length = ROOM_CODE_LENGTH) => {
  let roomCode = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    roomCode += CHARACTERS[randomIndex];
  }
  return roomCode;
};
