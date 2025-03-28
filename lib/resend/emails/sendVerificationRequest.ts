import { env } from "@/env.mjs";
import { SendVerificationRequestParams } from "next-auth/providers";
import { resend } from "..";
import Email from "../templates/LoginLink";

let sendWebVerificationRequest =
  (subject: string, from: string) =>
  async (params: SendVerificationRequestParams) => {
    try {
      await resend?.sendEmail({
        from,
        to: params.identifier,
        subject,
        react: Email({
          loginLink: params.url,
        }),
      });
    } catch (error) {
      console.log({ error });
    }
  };

export let sendVerificationRequest = sendWebVerificationRequest(
  "Welcome to llm.report",
  `${env.RESEND_FROM_NAME} < ${env.RESEND_FROM_ADDRESS} >`
);
