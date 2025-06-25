document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city-select');
    const weatherDisplay = document.getElementById('weather-display');

    const staticWeatherData = {
        'London': { temperature: '15°C', description: 'Cloudy', humidity: '80%', wind: '10 km/h' },
        'New York': { temperature: '22°C', description: 'Sunny', humidity: '60%', wind: '15 km/h' },
        'Tokyo': { temperature: '28°C', description: 'Partly Cloudy', humidity: '70%', wind: '8 km/h' },
        'Paris': { temperature: '18°C', description: 'Rainy', humidity: '90%', wind: '12 km/h' }
    };

    function displayWeather(city) {
        if (city && staticWeatherData[city]) {
            const data = staticWeatherData[city];
            weatherDisplay.innerHTML = `
                <p class="city-name">${city}</p>
                <p class="temperature">${data.temperature}</p>
                <p class="description">${data.description}</p>
                <p>Humidity: ${data.humidity}</p>
                <p>Wind: ${data.wind}</p>
            `;
        } else {
            weatherDisplay.innerHTML = '<p>Please select a city to see the weather.</p>';
        }
    }

    // Initial display when page loads (if a city is pre-selected or default message)
    displayWeather(citySelect.value);

    citySelect.addEventListener('change', (event) => {
        const selectedCity = event.target.value;
        displayWeather(selectedCity);
    });
});