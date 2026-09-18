import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WeatherService } from "./weather.service.js";
export function createWeatherServer() {
    const server = new McpServer({
        name: "weather-server",
        version: "1.0.0",
    });
    const weatherService = new WeatherService();
    // Tool: get_weather
    server.tool("get_weather", "Get current weather information for a specified city", {
        city: z.string().min(1).describe("City name, e.g. London, New York, Tokyo"),
    }, async ({ city }) => {
        try {
            const data = await weatherService.getWeather(city);
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Weather Tool Error: ${error.message}` }],
                isError: true,
            };
        }
    });
    // Tool: get_forecast
    server.tool("get_forecast", "Get 3-day weather forecast for a specified city", {
        city: z.string().min(1).describe("City name"),
    }, async ({ city }) => {
        try {
            const forecast = await weatherService.getForecast(city);
            return {
                content: [{ type: "text", text: JSON.stringify(forecast, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Forecast Tool Error: ${error.message}` }],
                isError: true,
            };
        }
    });
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
