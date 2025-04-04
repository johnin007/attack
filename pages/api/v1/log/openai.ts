import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { clickhouseClient } from "@/lib/clickhouse/clickhouseClient";
import { z } from "zod";
import { sha256 } from "../keys";

let schema = z.object({
  provider_id: z.string(),
  user_id: z.string().optional(),
  url: z.string(),
  method: z.string(),
  status: z.number(),
  cached: z.boolean().default(false),
  streamed: z.boolean().default(false),
  model: z.string(),
  prompt_tokens: z.number().default(0),
  completion_tokens: z.number().default(0),
  request_headers: z.string(),
  request_body: z.string(),
  response_headers: z.string(),
  response_body: z.string(),
  hashed_key: z.string().optional(),
  completion: z.string(),
  duration_in_ms: z.number(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate request body
  let response = schema.safeParse(req.body);
  if (!response.success) {
    let { errors } = response.error;
    console.log("errors", errors);

    return res.status(400).json({
      error: { message: "Invalid request", errors },
    });
  }

  // get llm.report api key
  let llmApikey = getLlmReportApiKey(req);
  if (!llmApikey) {
    return res.status(401).json({
      message: "Go to https://llm.report/ to get an API key.",
      error: "Missing API key in X-Api-Key header.",
    });
  }

  // get llm.report user from api key
  let user = await getUser(llmApikey);
  if (!user) {
    return res.status(401).json({
      message: "Go to https://llm.report/ to get an API key.",
      error: "User not found.",
    });
  }

  // insert request into clickhouse
  try {
    let body = {
      ...req.body,
      llm_report_user_id: user.id,
      provider: "openai",
    };
    await clickhouseClient.insert({
      table: "request",
      values: [body],
      format: "JSONEachRow",
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error inserting request into Clickhouse.",
      error,
    });
  }
}

let getLlmReportApiKey = (request: NextApiRequest) => {
  let headers = request.headers;
  let apiKey = headers["x-api-key"];

  if (!apiKey) return null;
  return apiKey as string;
};

let getUser = async (apiKey: string) => {
  let key = await prisma.apiKey.findUnique({
    where: {
      hashed_key: await sha256(apiKey),
    },
    include: {
      user: true,
    },
  });

  return key?.user;
};
