import { FactModel } from "@models/fact.model";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import { VoteModel } from "@models/vote.model";
import { VotingResultsModel } from "@models/votingResults.model";

export function setupAssociations() {
  // Room

  RoomModel.hasMany(PlayerModel, { foreignKey: "roomId", as: "players" });

  RoomModel.belongsTo(FactModel, {
    foreignKey: { name: "currentVotingFactId", allowNull: true },
    as: "currentVotingFact",
  });

  RoomModel.hasMany(VoteModel, {
    foreignKey: "roomId",
    as: "votes",
  });

  RoomModel.hasMany(FactModel, {
    foreignKey: "roomId",
    as: "facts",
  });

  // Player

  PlayerModel.belongsTo(RoomModel, { foreignKey: "roomId", as: "room" });

  // Fact

  FactModel.belongsTo(RoomModel, {
    foreignKey: "roomId",
    as: "room",
  });

  FactModel.belongsTo(PlayerModel, {
    foreignKey: "authorId",
    as: "author",
  });

  FactModel.belongsTo(PlayerModel, {
    foreignKey: { name: "selectedPlayerId", allowNull: true },
    as: "selectedPlayer",
  });

  // Vote

  VoteModel.belongsTo(RoomModel, {
    foreignKey: { name: "roomId", allowNull: false },
    as: "room",
  });

  VoteModel.belongsTo(FactModel, {
    foreignKey: { name: "factId", allowNull: false },
    as: "fact",
  });

  VoteModel.belongsTo(PlayerModel, {
    foreignKey: { name: "voterId", allowNull: false },
    as: "voter",
  });

  VoteModel.belongsTo(PlayerModel, {
    foreignKey: { name: "selectedPlayerId", allowNull: false },
    as: "selectedPlayer",
  });

  // VotingResults

  VotingResultsModel.belongsTo(RoomModel, {
    foreignKey: "roomId",
    as: "room",
  });

  VotingResultsModel.belongsTo(FactModel, {
    foreignKey: "factId",
    as: "fact",
  });

  VotingResultsModel.belongsTo(PlayerModel, {
    foreignKey: { name: "selectedPlayerId", allowNull: true },
    as: "selectedPlayer",
  });
}
