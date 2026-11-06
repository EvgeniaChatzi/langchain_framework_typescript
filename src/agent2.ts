import { loadEnvFile } from "node:process";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent, tool } from "langchain";
import * as z from "zod";

const config = {
  context: { user_id: "user_id" },
};

loadEnvFile(".env");

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing from .env.");

const demoUserLocations: Record<string, string> = {
  user_id: "Paris",
};

const getLocation = tool(
  (_, config) => {
    const city = demoUserLocations[config.context.user_id];
    return city
      ? `The user's location is ${city}.`
      : `No location is available for user ${config.context.user_id}.`;
  },
  {
    name: "get_location",
    description: "Get the user's city using their user ID.",
    schema: z.object({}),
  },
);

const agent = createAgent({
  model: new ChatAnthropic({ apiKey, model: "claude-sonnet-5" }),
  tools: [getLocation],
  contextSchema: z.object({ user_id: z.string() }),
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "what is the weather outside" }],
}, config);

console.log(result);