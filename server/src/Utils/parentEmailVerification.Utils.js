
import {
  generateEmailVerificationCode,
  hashEmailVerificationCode,
} from "./Tokens.Utils.js";

import {
  deleteActiveParentVerificationCodes,
  createParentVerificationCode,
} from "../Model/parentEmailVerification.Model.js";

import {
  sendParentEmailVerificationCode,
} from "./parentEmailVerificationEmail.Utils.js";

const VERIFICATION_CODE_LIFETIME =
  10 * 60 * 1000;

export const createAndSendParentVerificationCode =
  async (parent) => {
    const code =
      generateEmailVerificationCode();

    const codeDigest =
      hashEmailVerificationCode(
        parent.id,
        code
      );

    const expiresAt =
      new Date(
        Date.now() +
          VERIFICATION_CODE_LIFETIME
      );

    await deleteActiveParentVerificationCodes(
      parent.id
    );

    await createParentVerificationCode({
      parentId: parent.id,
      codeDigest,
      expiresAt,
    });

    await sendParentEmailVerificationCode({
      email: parent.email,
      name: parent.name,
      code,
    });
  };