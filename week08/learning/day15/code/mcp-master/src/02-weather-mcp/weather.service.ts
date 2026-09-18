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
