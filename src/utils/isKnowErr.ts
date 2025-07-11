import { ErrModel } from "@shared/types";

export const isKnowErr = (err: unknown): err is ErrModel =>
  !!err && typeof err === "object" && "enumCode" in err;
