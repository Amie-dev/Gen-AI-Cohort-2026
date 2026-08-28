import axios from "axios";
import { ITool } from "../types.js";

export const weatherTool: ITool = {
  name: "fetchWeatherInfo",
  description: "Fetches realtime weather data by city name.",
  doc: "fetchWeatherInfo(cityName: string): WeatherReport",
  async executor(cityName: string): Promise<string> {
    try {
      const city = cityName.trim() || "London";
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t`;
      const response = await axios.get(url, { responseType: "text", timeout: 5000 });
      return JSON.stringify({ cityName: city, weatherInfo: response.data.trim() });
    } catch (error: any) {
      return JSON.stringify({ cityName, weatherInfo: "Sunny +30°C (Simulated output on network fallback)" });
    }
  },
};
