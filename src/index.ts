import "module-alias/register";
import "./instrument";

import { app, io, server } from "@app";
import { UNKNOWN_ROOM_CODE } from "@constants";
import { registerDisconnectingHostOrPlayer } from "@socketEvents/common";
import {
  registerCreateRoom,
  registerFindRoomByHostId,
  registerReenterRoom,
  registerStartVoting,
} from "@socketEvents/onlyHost";
import {
  registerAddFact,
  registerAddVote,
  registerJoinRoom,
  registerStartGame,
} from "@socketEvents/onlyPlayer";
import { registerChangeAvatar } from "@socketEvents/onlyPlayer/changeAvatar";
import { sentryLog } from "@utils/logger";
import cors from "cors";

const PORT = process.env.PORT || 5001;

app.use(cors());

app.get("/", (req, res) => {
  res.send("<h1>Server is running</h1>");
});

io.on("connection", (socket) => {
  sentryLog({
    message: "Пользователь подключился",
    eventFrom: "client",
    actionName: "connection",
    roomCode: UNKNOWN_ROOM_CODE,
    eventInputData: {
      socketId: socket.id,
    },
    severity: "info",
    eventFromType: "unknown",
  });

  // host
  registerCreateRoom(socket);
  registerReenterRoom(socket);
  registerFindRoomByHostId(socket);
  registerStartVoting(socket);

  //player
  registerJoinRoom(socket);
  registerChangeAvatar(socket);
  registerStartGame(socket);
  registerAddFact(socket);
  registerAddVote(socket);

  // common
  registerDisconnectingHostOrPlayer(socket);
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
