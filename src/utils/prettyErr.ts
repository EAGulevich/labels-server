import { ErrModel, ERROR_CODES } from "@shared/types";
import { isKnowErr } from "@utils/isKnowErr";

export const prettyErr = (err: unknown): ErrModel => {
  if (isKnowErr(err)) {
    return err;
  } else {
    return {
      enumCode: ERROR_CODES.SERVER_ERROR,
      description: JSON.stringify(err),
    };
  }
};
