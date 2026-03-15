class MediatekaManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('mediatekaItems')) || [];
        this.currentUser = localStorage.getItem('currentUser');
    }

    saveItems() {
        localStorage.setItem('mediatekaItems', JSON.stringify(this.items));
    }

    addItem(itemData) {
        const item = {
            id: Date.now(),
            author: this.currentUser,
            title: itemData.title,
            type: itemData.type,
            description: itemData.description,
            rating: itemData.rating,
            watched: false,
            createdAt: new Date().toISOString()
        };
        this.items.unshift(item);
        this.saveItems();
        return item;
    }

    toggleWatched(id) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.watched = !item.watched;
            this.saveItems();
        }
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveItems();
    }

    getItems() {
        return this.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getItemsByType(type) {
        return this.getItems().filter(item => item.type === type);
    }
}

function initializeMediateka() {
    console.log('Initializing mediateka...');
    
    const mediatekaManager = new MediatekaManager();
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowForm = urlParams.get('add') === '1';
    
    console.log('Should show form:', shouldShowForm);

    if (shouldShowForm) {
        console.log('Showing add item form...');
        showAddItemForm();
    } else {
        console.log('Rendering mediateka items...');
        renderMediatekaItems();
    }

    function showAddItemForm() {
        console.log('showAddItemForm called');
        const contentSection = document.querySelector('.content');
        console.log('Content section:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found!');
            return;
        }
        
        const formHTML = `
            <div class="content-card card">
                <h2 class="card-title">Добавить в медиатеку</h2>
                <form id="mediateka-form">
                    <div class="form-group">
                        <label for="item-title">Название:</label>
                        <input type="text" id="item-title" required placeholder="Введите название фильма/сериала/книги">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="item-type">Тип:</label>
                            <select id="item-type" required>
                                <option value="">Выберите тип</option>
                                <option value="movie">🎬 Фильм</option>
                                <option value="series">📺 Сериал</option>
                                <option value="book">📚 Книга</option>
                                <option value="game">🎮 Игра</option>
                                <option value="music">🎵 Музыка</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="item-rating">Оценка:</label>
                            <select id="item-rating">
                                <option value="">Без оценки</option>
                                <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                <option value="4">⭐⭐⭐⭐ 4</option>
                                <option value="3">⭐⭐⭐ 3</option>
                                <option value="2">⭐⭐ 2</option>
                                <option value="1">⭐ 1</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="item-description">Описание/Комментарий:</label>
                        <textarea id="item-description" rows="4" placeholder="Ваши впечатления, описание или любой комментарий"></textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">Сохранить</button>
                        <button type="button" class="btn-secondary" onclick="hideAddMediatekaForm()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        console.log('Setting form HTML...');
        contentSection.innerHTML = formHTML;
        console.log('Form HTML set');
        
        // Обработчик формы
        const form = document.getElementById('mediateka-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const itemData = {
                    title: document.getElementById('item-title').value,
                    type: document.getElementById('item-type').value,
                    description: document.getElementById('item-description').value,
                    rating: document.getElementById('item-rating').value || ''
                };
                
                console.log('Submitting item:', itemData);
                mediatekaManager.addItem(itemData);
                hideAddMediatekaForm();
                renderMediatekaItems();
            });
            console.log('Form event listener added');
        } else {
            console.error('Form not found after setting HTML!');
        }
    }

    window.hideAddMediatekaForm = function() {
        window.location.href = 'mediateka.html';
    };

    function renderMediatekaItems() {
        console.log('renderMediatekaItems called');
        const contentSection = document.querySelector('.content');
        console.log('Content section in renderMediatekaItems:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found in renderMediatekaItems!');
            return;
        }
        
        const items = mediatekaManager.getItems();
        console.log('Items count:', items.length);
        
        if (items.length === 0) {
            contentSection.innerHTML = `
                <div class="content-card card">
                    <h2 class="card-title">Медиатека</h2>
                    <p class="content-placeholder">Здесь будет ваша коллекция медиа. Добавить можно с главной страницы.</p>
                </div>
            `;
            return;
        }

        // Группировка по типам
        const itemsByType = {
            movie: mediatekaManager.getItemsByType('movie'),
            series: mediatekaManager.getItemsByType('series'),
            book: mediatekaManager.getItemsByType('book'),
            game: mediatekaManager.getItemsByType('game'),
            music: mediatekaManager.getItemsByType('music')
        };

        const typeNames = {
            movie: '🎬 Фильмы',
            series: '📺 Сериалы',
            book: '📚 Книги',
            game: '🎮 Игры',
            music: '🎵 Музыка'
        };

        let contentHTML = '<div class="content-card card"><h2 class="card-title">Медиатека</h2>';

        Object.entries(itemsByType).forEach(([type, typeItems]) => {
            if (typeItems.length > 0) {
                contentHTML += `
                    <div class="mediateka-section">
                        <h3 class="mediateka-section-title">${typeNames[type]}</h3>
                        <div class="mediateka-items">
                            ${typeItems.map(item => createMediatekaItemHTML(item)).join('')}
                        </div>
                    </div>
                `;
            }
        });

        contentHTML += '</div>';
        contentSection.innerHTML = contentHTML;

        // Обработчики для удаления
        document.querySelectorAll('.mediateka-item-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.itemId);
                if (confirm('Удалить этот элемент из медиатеки?')) {
                    mediatekaManager.deleteItem(itemId);
                    renderMediatekaItems();
                }
            });
        });

        // Обработчики для отметки "просмотрено"
        document.querySelectorAll('.mediateka-item-watched').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.itemId);
                mediatekaManager.toggleWatched(itemId);
                renderMediatekaItems();
            });
        });
    }

    function createMediatekaItemHTML(item) {
        const createdDate = new Date(item.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const ratingHTML = item.rating ? 
            `<span class="mediateka-item-rating">${'⭐'.repeat(parseInt(item.rating))}</span>` : '';

        const watchedClass = item.watched ? 'watched' : '';
        const watchedText = item.watched ? '✅' : '👁️';

        return `
            <div class="mediateka-item ${watchedClass}" data-item-id="${item.id}">
                <div class="mediateka-item-header">
                    <div class="mediateka-item-meta">
                        <span class="mediateka-item-author">${item.author}</span>
                        <span class="mediateka-item-date">${createdDate}</span>
                        ${ratingHTML}
                    </div>
                    <div class="mediateka-item-actions">
                        <button class="mediateka-item-watched" data-item-id="${item.id}" title="Отметить как просмотренное">
                            ${watchedText}
                        </button>
                        <button class="mediateka-item-delete" data-item-id="${item.id}">🗑️</button>
                    </div>
                </div>
                <div class="mediateka-item-title">${item.title}</div>
                ${item.description ? `<div class="mediateka-item-description">${item.description}</div>` : ''}
            </div>
        `;
    }
}
