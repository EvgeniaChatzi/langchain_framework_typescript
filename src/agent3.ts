import { loadEnvFile } from "node:process";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent, tool } from "langchain";
import * as z from "zod";

const config = {
  context: { user_id: "user_id" },
};

const responseFormat = z.object({
  humour_response: z.string(),
  weather_conditions: z.string(),
});

const systemPrompt = `You are an expert weather forecaster.

You have access to two tools:
- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.

Return both fields in the response schema. Keep weather_conditions factual and concise. Make humour_response a genuinely witty, lighthearted weather-related joke.`;

loadEnvFile(".env");

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing from .env.");

const demoUserLocations: Record<string, string> = {
  user_id: "Paris",
};

const getUserLocation = tool(
  (_, config) => {
    const city = demoUserLocations[config.context.user_id];
    return city
      ? `The user's location is ${city}.`
      : `No location is available for user ${config.context.user_id}.`;
  },
  {
    name: "get_user_location",
    description: "Get the user's location using their user ID.",
    schema: z.object({}),
  },
);

const getWeatherForLocation = tool(
  ({ input }) => `The weather in ${input.location} is sunny.`,
  {
    name: "get_weather_for_location",
    description: "Get the weather for a specific location.",
    schema: z.object({
      input: z.object({
        location: z.string().describe("The location to get the weather for."),
      }),
    }),
  },
);

const agent = createAgent({
  model: new ChatAnthropic({ apiKey, model: "claude-sonnet-5" }),
  tools: [getWeatherForLocation, getUserLocation],
  systemPrompt,
  contextSchema: z.object({ user_id: z.string() }),
  responseFormat,
});

const result = await agent.invoke(
  {
    messages: [{ role: "user", content: "what is the weather outside" }],
  },
  config,
);

console.log(result);
