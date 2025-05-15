import "module-alias/register";
import cors from "cors";
import { logger } from "@utils/logger";
import { app, io, server } from "./App";
import {
  registerCreateRoom,
  registerReenterRoom,
  registerFindRoomByHostId,
} from "@socketEvents/onlyHost";
import { registerJoinRoom } from "@socketEvents/onlyPlayer";
import { registerDisconnectingHostOrPlayer } from "@socketEvents/common";

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

  // common
  registerDisconnectingHostOrPlayer(socket);
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
