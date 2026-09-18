# Chapter 2: Weather Domain Service & MCP Server

## 1. Overview & Service Architecture

Module 2 demonstrates how to decouple domain business logic from the Model Context Protocol transport layer. 

In production applications, tools should not implement raw database calls or external HTTP requests directly inside MCP route handlers. Instead, business logic should be encapsulated inside a dedicated **Domain Service class** (`WeatherService`) which is invoked by the MCP tool handlers.

---

## 2. Weather Service (`weather.service.ts`)

Source file: [weather.service.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/02-weather-mcp/weather.service.ts)

```typescript
export interface WeatherData {
  city: string;
  temperature: number;
  unit: string;
  condition: string;
  humidity: number;
  windSpeed: string;
}

export interface ForecastData {
  city: string;
  forecast: Array<{ day: string; tempHigh: number; tempLow: number; condition: string }>;
}

export class WeatherService {
  private mockDatabase: Record<string, WeatherData> = {
    "london": { city: "London", temperature: 16, unit: "C", condition: "Cloudy", humidity: 72, windSpeed: "15 km/h" },
    "new york": { city: "New York", temperature: 22, unit: "C", condition: "Sunny", humidity: 55, windSpeed: "10 km/h" },
    "tokyo": { city: "Tokyo", temperature: 26, unit: "C", condition: "Rainy", humidity: 80, windSpeed: "18 km/h" },
    "paris": { city: "Paris", temperature: 19, unit: "C", condition: "Partly Cloudy", humidity: 60, windSpeed: "12 km/h" },
    "sydney": { city: "Sydney", temperature: 18, unit: "C", condition: "Clear", humidity: 50, windSpeed: "20 km/h" },
  };

  public async getWeather(city: string): Promise<WeatherData> {
    const key = city.trim().toLowerCase();
    const data = this.mockDatabase[key];
    if (!data) {
      throw new Error(`Weather data not found for city: ${city}`);
    }
    return data;
  }

  public async getForecast(city: string): Promise<ForecastData> {
    const key = city.trim().toLowerCase();
    if (!this.mockDatabase[key]) {
      throw new Error(`Forecast data not found for city: ${city}`);
    }
    return {
      city: this.mockDatabase[key].city,
      forecast: [
        { day: "Tomorrow", tempHigh: 24, tempLow: 15, condition: "Sunny" },
        { day: "Day After", tempHigh: 22, tempLow: 14, condition: "Rainy" },
        { day: "In 3 Days", tempHigh: 25, tempLow: 16, condition: "Cloudy" },
      ],
    };
  }
}
```

---

## 3. Weather MCP Server (`server.ts`)

Source file: [server.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/02-weather-mcp/server.ts)

The server instantiates `WeatherService` and maps tool invocations to service methods within error-bounded try/catch handlers:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WeatherService } from "./weather.service.js";

export function createWeatherServer(): McpServer {
  const server = new McpServer({
    name: "weather-server",
    version: "1.0.0",
  });

  const weatherService = new WeatherService();

  // Tool 1: get_weather
  server.tool(
    "get_weather",
    "Get current weather information for a specified city",
    {
      city: z.string().min(1).describe("City name, e.g. London, New York, Tokyo"),
    },
    async ({ city }) => {
      try {
        const data = await weatherService.getWeather(city);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Weather Tool Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 2: get_forecast
  server.tool(
    "get_forecast",
    "Get 3-day weather forecast for a specified city",
    {
      city: z.string().min(1).describe("City name"),
    },
    async ({ city }) => {
      try {
        const forecast = await weatherService.getForecast(city);
        return {
          content: [{ type: "text", text: JSON.stringify(forecast, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Forecast Tool Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}

if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  const server = createWeatherServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error("Fatal error in Weather MCP Server:", err);
    process.exit(1);
  });
}
```

---

## 4. Weather Client Implementation (`client.ts`)

Source file: [client.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/02-weather-mcp/client.ts)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🚀 Starting Weather MCP Client test...");

  const serverPath = path.join(__dirname, "server.ts");
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", serverPath],
  });

  const client = new Client(
    { name: "weather-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to Weather MCP Server via STDIO");

  // 1. Get weather for Tokyo
  const tokyoWeather = await client.callTool({
    name: "get_weather",
    arguments: { city: "Tokyo" },
  });
  console.log("\n🌤️ Weather in Tokyo:\n", (tokyoWeather.content as any[])?.[0]?.text);

  // 2. Get 3-day forecast for London
  const londonForecast = await client.callTool({
    name: "get_forecast",
    arguments: { city: "London" },
  });
  console.log("\n📅 3-Day Forecast for London:\n", (londonForecast.content as any[])?.[0]?.text);

  // 3. Error case: Invalid city
  const invalidCity = await client.callTool({
    name: "get_weather",
    arguments: { city: "Atlantis" },
  });
  console.log("\n⚠️ Error Handling Test (Invalid City):\n", invalidCity);

  await client.close();
  console.log("\n👋 Weather Client test complete.");
}

main().catch((err) => {
  console.error("❌ Weather client error:", err);
  process.exit(1);
});
```

---

## 5. Execution & Verification

Run the test suite using NPM:

```bash
npm run dev:02-weather
```

### Terminal Output
```text
🚀 Starting Weather MCP Client test...
✅ Connected to Weather MCP Server via STDIO

🌤️ Weather in Tokyo:
 {
  "city": "Tokyo",
  "temperature": 26,
  "unit": "C",
  "condition": "Rainy",
  "humidity": 80,
  "windSpeed": "18 km/h"
}

📅 3-Day Forecast for London:
 {
  "city": "London",
  "forecast": [
    { "day": "Tomorrow", "tempHigh": 24, "tempLow": 15, "condition": "Sunny" },
    { "day": "Day After", "tempHigh": 22, "tempLow": 14, "condition": "Rainy" },
    { "day": "In 3 Days", "tempHigh": 25, "tempLow": 16, "condition": "Cloudy" }
  ]
}

⚠️ Error Handling Test (Invalid City):
 {
  content: [
    {
      type: 'text',
      text: 'Weather Tool Error: Weather data not found for city: Atlantis'
    }
  ],
  isError: true
}

👋 Weather Client test complete.
```
