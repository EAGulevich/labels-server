import "module-alias/register";

import { app, io, server } from "@app";
import { registerDisconnectingHostOrPlayer } from "@socketEvents/common";
import {
  registerCreateRoom,
  registerFindRoomByHostId,
  registerReenterRoom,
} from "@socketEvents/onlyHost";
import { registerJoinRoom, registerStartGame } from "@socketEvents/onlyPlayer";
import { logger } from "@utils/logger";
import cors from "cors";

const PORT = process.env.PORT || 5001;

app.use(cors());

app.get("/", (req, res) => {
  res.send("<h1>Server is running</h1>");
});

io.on("connection", (socket) => {
  logger(`USER CONNECTED: ${socket.id}`);

  // host
  registerCreateRoom(socket);
  registerReenterRoom(socket);
  registerFindRoomByHostId(socket);

  //player
  registerJoinRoom(socket);
  registerStartGame(socket);

  // common
  registerDisconnectingHostOrPlayer(socket);
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
