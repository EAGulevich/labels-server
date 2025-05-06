export type Player = {
  id: string;
  name: string;
  avatarToken: string;
};

export type Room = {
  code: string;
  status: 'CREATED';
  creatorSocketId: string;
  players: Player[];
};
