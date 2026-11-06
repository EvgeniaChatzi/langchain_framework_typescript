import { loadEnvFile } from "node:process";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent, tool } from "langchain";
import * as z from "zod";

loadEnvFile(".env");

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is missing from .env.");
}

const weatherTool = tool(
  ({ city }) => `The weather in ${city} is sunny.`,
  {
    name: "get_weather",
    description: "Get the current weather for a city.",
    schema: z.object({
      city: z.string().describe("The city to check."),
    }),
  },
);

const agent = createAgent({
  model: new ChatAnthropic({ apiKey, model: "claude-sonnet-5" }),
  tools: [weatherTool],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather in Paris?" }],
});

console.log(result.messages.at(-1)?.content);