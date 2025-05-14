import "module-alias/register";
import cors from "cors";
import { logger } from "@utils/logger";
import { app, io, server } from "./App";
import {
  registerCreateOrReenterRoom,
  registerJoinRoom,
  registerDisconnectingHostOrPlayer,
  registerFindRoomByHostId,
} from "@socketEvents/index";

const PORT = process.env.PORT || 5001;

app.use(cors());

app.get("/", (req, res) => {
  res.send("<h1>Server is running</h1>");
});

io.on("connection", (socket) => {
  logger(`USER CONNECTED: ${socket.id}`);

  registerFindRoomByHostId(socket);
  registerCreateOrReenterRoom(socket);
  registerJoinRoom(socket);
  registerDisconnectingHostOrPlayer(socket);
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
