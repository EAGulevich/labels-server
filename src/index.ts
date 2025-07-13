import "module-alias/register";
import "./instrument";

import { app, io, server } from "@app";
import { setupAssociations } from "@models/associations";
import { GameService } from "@services/game.service";
import { registerLogging } from "@socketEvents/logging/addLogging";
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
import { registerShowResult } from "@socketEvents/onlyPlayer/showResult";
import { sentryLog } from "@utils/logger";
import cors from "cors";

import { sequelize } from "./models";

const PORT = process.env.PORT || 5001;

(async () => {
  setupAssociations();
  await sequelize.sync({ force: true }).then(() => {
    console.log("Database synced");
  });
})();

app.use(cors());

app.get("/", (_, res) => {
  res.send("<h1>Server is running</h1>");
});

io.on("connection", (socket) => {
  socket.data.userId = socket.handshake.auth.userId || socket.id;

  sentryLog({
    actionName: "connection",
    severity: "info",
    eventFrom: "client",
    message: "Пользователь подключился",
    userId: socket.data.userId,
  });

  registerLogging(socket);

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
  registerShowResult(socket);

  // common
  socket.on("disconnecting", async () => {
    sentryLog({
      actionName: "disconnecting",
      severity: "info",
      eventFrom: "client",
      message: "Пользователь отключается",
      userId: socket.data.userId,
    });

    try {
      await GameService.disconnect({ userId: socket.data.userId });
    } catch (error) {
      console.error("Disconnecting user error:", error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
