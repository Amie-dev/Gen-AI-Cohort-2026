export class WeatherService {
    mockDatabase = {
        "london": { city: "London", temperature: 16, unit: "C", condition: "Cloudy", humidity: 72, windSpeed: "15 km/h" },
        "new york": { city: "New York", temperature: 22, unit: "C", condition: "Sunny", humidity: 55, windSpeed: "10 km/h" },
        "tokyo": { city: "Tokyo", temperature: 26, unit: "C", condition: "Rainy", humidity: 80, windSpeed: "18 km/h" },
        "paris": { city: "Paris", temperature: 19, unit: "C", condition: "Partly Cloudy", humidity: 60, windSpeed: "12 km/h" },
        "sydney": { city: "Sydney", temperature: 18, unit: "C", condition: "Clear", humidity: 50, windSpeed: "20 km/h" },
    };
    async getWeather(city) {
        const key = city.trim().toLowerCase();
        const data = this.mockDatabase[key];
        if (!data) {
            throw new Error(`Weather data not found for city: ${city}`);
        }
        return data;
    }
    async getForecast(city) {
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
