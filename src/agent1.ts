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
  ({ input }) => `The weather in ${input.city} is sunny.`,
  {
    name: "get_weather",
    description: "Get the current weather for a city.",
    schema: z.object({
      input: z.object({
        city: z.string().describe("The city to check."),
      }),
    }),
  },
);

const timeTool = tool(
  ({ input }) => `The current time in ${input.city} is ${new Date().toLocaleTimeString()}.`,
  {
    name: "get_time",
    description: "Get the current time for a city.",
    schema: z.object({
      input: z.object({
        city: z.string().describe("The city to check."),
      }),
    }),
  },
);

const agent = createAgent({
  model: new ChatAnthropic({ apiKey, model: "claude-sonnet-5" }),
  tools: [weatherTool, timeTool],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather and current time in Paris?" }],
});

console.log(result);