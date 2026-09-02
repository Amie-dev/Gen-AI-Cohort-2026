import axios from "axios";
import { ITool } from "../types.js";

export const weatherTool: ITool = {
  name: "fetchWeatherInfo",
  description: "Fetches realtime weather report by city name using wttr.in.",
  doc: "fetchWeatherInfo(cityName: string): WeatherReport",
  async executor(cityName: string): Promise<string> {
    try {
      const city = cityName.trim() || "Goa";
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t`;
      const response = await axios.get(url, { responseType: "text", timeout: 5000 });
      return JSON.stringify({ cityName: city, weatherInfo: response.data.trim() });
    } catch {
      return JSON.stringify({ cityName, weatherInfo: "Sunny +30°C (Simulated fallback)" });
    }
  },
};
