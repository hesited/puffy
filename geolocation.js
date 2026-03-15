function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Геолокация не поддерживается вашим браузером');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const location = await reverseGeocode(latitude, longitude);
                    resolve(location);
                } catch (error) {
                    reject('Не удалось определить местоположение');
                }
            },
            (error) => {
                reject('Не удалось получить доступ к геолокации');
            }
        );
    });
}

async function reverseGeocode(lat, lon) {
    try {
        // Используем Nominatim API для обратного геокодирования
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
        );
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            const parts = [];
            
            if (address.city || address.town || address.village) {
                parts.push(address.city || address.town || address.village);
            }
            if (address.state) {
                parts.push(address.state);
            }
            if (address.country) {
                parts.push(address.country);
            }
            
            return parts.join(', ') || 'Неизвестное местоположение';
        }
        
        return 'Неизвестное местоположение';
    } catch (error) {
        console.error('Geocoding error:', error);
        return 'Неизвестное местоположение';
    }
}

// Функция для автоматического заполнения поля местоположения
async function autoFillLocation() {
    const locationInput = document.getElementById('note-location');
    if (!locationInput) return;
    
    try {
        const location = await getLocation();
        locationInput.value = location;
    } catch (error) {
        console.log('Auto-location failed:', error);
        locationInput.value = '';
    }
}
