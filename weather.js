/**
 * Погода по местоположению (Open-Meteo API, без ключа)
 */
(function () {
    const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
    const weatherContent = document.getElementById("weather-content");

    if (!weatherContent) return;

    const weatherCodes = {
        0: "Ясно",
        1: "Преимущественно ясно",
        2: "Переменная облачность",
        3: "Пасмурно",
        45: "Туман",
        48: "Изморозь",
        51: "Морось",
        53: "Морось",
        55: "Морось",
        61: "Дождь",
        63: "Дождь",
        65: "Сильный дождь",
        66: "Ледяной дождь",
        67: "Сильный ледяной дождь",
        71: "Снег",
        73: "Снег",
        75: "Сильный снег",
        77: "Снежные зёрна",
        80: "Ливень",
        81: "Ливень",
        82: "Сильный ливень",
        85: "Снегопад",
        86: "Сильный снегопад",
        95: "Гроза",
        96: "Гроза с градом",
        99: "Гроза с градом"
    };

    function getWeatherDescription(code) {
        if (weatherCodes[code]) return weatherCodes[code];
        if (code >= 1 && code <= 3) return "Облачно";
        if (code >= 51 && code <= 67) return "Дождь";
        if (code >= 71 && code <= 77) return "Снег";
        if (code >= 80 && code <= 82) return "Ливень";
        return "Облачно";
    }

    function getWeatherEmoji(code) {
        if (code === 0 || code === 1) return "☀️";
        if (code === 2 || code === 3) return "☁️";
        if (code === 45 || code === 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 71 && code <= 77) return "❄️";
        if (code >= 80 && code <= 82) return "🌦️";
        if (code >= 95 && code <= 99) return "⛈️";
        return "🌤️";
    }

    function renderWeather(data) {
        const cur = data.current;
        const temp = Math.round(cur.temperature_2m);
        const desc = getWeatherDescription(cur.weather_code);
        const emoji = getWeatherEmoji(cur.weather_code);
        const humidity = cur.relative_humidity_2m != null ? cur.relative_humidity_2m : null;
        const wind = cur.wind_speed_10m != null ? Math.round(cur.wind_speed_10m) : null;

        let html = `
            <div class="weather-main">
                <span class="weather-emoji" aria-hidden="true">${emoji}</span>
                <div class="weather-temp-block">
                    <span class="weather-temp">${temp}°</span>
                    <span class="weather-desc">${desc}</span>
                </div>
            </div>
        `;
        if (humidity !== null || wind !== null) {
            html += '<div class="weather-details">';
            if (humidity !== null) html += `<span class="weather-detail">Влажность ${humidity}%</span>`;
            if (wind !== null) html += `<span class="weather-detail">Ветер ${wind} м/с</span>`;
            html += '</div>';
        }
        weatherContent.innerHTML = html;
    }

    function showError(message) {
        weatherContent.innerHTML = `<p class="weather-error">${message}</p>`;
    }

    function showLoading(message) {
        weatherContent.innerHTML = `<p class="weather-loading">${message}</p>`;
    }

    function fetchWeather(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
            timezone: "auto"
        });
        return fetch(`${WEATHER_API}?${params}`).then(function (r) {
            if (!r.ok) throw new Error("Ошибка запроса погоды");
            return r.json();
        });
    }

    function init() {
        if (!navigator.geolocation) {
            showError("Геолокация недоступна");
            return;
        }
        showLoading("Определяем местоположение…");

        navigator.geolocation.getCurrentPosition(
            function (pos) {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                showLoading("Загружаем погоду…");
                fetchWeather(lat, lon)
                    .then(function (data) {
                        renderWeather(data);
                    })
                    .catch(function () {
                        showError("Не удалось загрузить погоду");
                    });
            },
            function () {
                showError("Доступ к местоположению запрещён");
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    }

    init();
})();
