const searchInput   = document.getElementById("searchInput");
const searchBtn     = document.getElementById("searchBtn");
const weatherResult = document.getElementById("weatherResult");
const errorDiv      = document.getElementById("errorDiv");

function getWeatherEmoji(code, isDay) {
    if (code === 0)  return isDay ? "☀️" : "🌙";
    if (code === 1)  return isDay ? "🌤️" : "🌙";
    if (code === 2)  return "⛅";
    if (code === 3)  return "☁️";
    if (code <= 48)  return "🌫️";
    if (code <= 55)  return "🌦️";
    if (code <= 65)  return "🌧️";
    if (code <= 75)  return "❄️";
    if (code <= 82)  return "🌧️";
    if (code <= 86)  return "🌨️";
    if (code >= 95)  return "⛈️";
    return "🌡️";
}

function getCondition(code) {
    if (code === 0)   return "Clear Sky";
    if (code <= 2)    return "Partly Cloudy";
    if (code === 3)   return "Cloudy";
    if (code <= 48)   return "Foggy";
    if (code <= 55)   return "Drizzle";
    if (code <= 65)   return "Rainy";
    if (code <= 75)   return "Snowy";
    if (code <= 82)   return "Rain Showers";
    if (code <= 86)   return "Snow Showers";
    if (code >= 95)   return "Thunderstorm";
    return "Unknown";
}

function applyWeatherToDOM(d) {
    document.querySelector(".city").textContent            = d.cityName;
    document.querySelector(".temp").textContent            = d.temp;
    document.querySelector(".humidity").textContent        = d.humidity;
    document.querySelector(".wind").textContent            = d.wind;
    document.querySelector(".condition").textContent       = d.condition;
    document.querySelector(".timezone").textContent        = d.timezone;
    document.querySelector(".weather-icon").textContent    = d.weatherIcon;
    document.querySelector(".day-night-icon").textContent  = d.dayNightIcon;
    document.querySelector(".day-night-label").textContent = d.dayNightLabel;
    document.querySelector(".day-night-badge").className   = "day-night-badge " + d.dayNightBadge;
}

function setLoading(on) {
    searchBtn.textContent = on ? "..." : "Search";
    searchBtn.disabled    = on;
}

function restoreWeather() {
    const saved = sessionStorage.getItem('weatherData');
    if (!saved) return;
    applyWeatherToDOM(JSON.parse(saved));
    weatherResult.style.display = "block";
}

function showError() {
    errorDiv.style.display      = "block";
    weatherResult.style.display = "none";
}

async function checkWeather(city) {
    errorDiv.style.display = "none";
    setLoading(true);

    try {
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError();
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&wind_speed_unit=kmh&timezone=auto`
        );
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        const tz        = weatherData.timezone;
        const tzAbbr    = weatherData.timezone_abbreviation;
        const localTime = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true
        }).format(new Date());

        const isDay    = current.is_day === 1;
        const cityName = `${name}, ${country}`;

        const displayData = {
            cityName,
            temp:          Math.round(current.temperature_2m) + "°c",
            humidity:      current.relative_humidity_2m + "%",
            wind:          current.wind_speed_10m + " km/h",
            condition:     getCondition(current.weather_code),
            timezone:      `🕐 ${localTime}  •  ${tzAbbr}`,
            weatherIcon:   getWeatherEmoji(current.weather_code, isDay),
            dayNightIcon:  isDay ? "☀️" : "🌙",
            dayNightLabel: isDay ? "Day" : "Night",
            dayNightBadge: isDay ? "day" : "night"
        };

        applyWeatherToDOM(displayData);
        sessionStorage.setItem('weatherData', JSON.stringify(displayData));

        weatherResult.style.display = "block";
        errorDiv.style.display      = "none";

    } catch (err) {
        showError();
    } finally {
        setLoading(false);
    }
}

restoreWeather();

searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) checkWeather(city);
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = searchInput.value.trim();
        if (city) checkWeather(city);
    }
});
