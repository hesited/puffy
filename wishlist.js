class WishlistManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('wishlistItems')) || [];
        this.currentUser = localStorage.getItem('currentUser');
    }

    saveItems() {
        localStorage.setItem('wishlistItems', JSON.stringify(this.items));
    }

    addItem(itemData) {
        const item = {
            id: Date.now(),
            author: this.currentUser,
            title: itemData.title,
            link: itemData.link,
            imageUrl: itemData.imageUrl,
            description: itemData.description,
            createdAt: new Date().toISOString()
        };
        this.items.unshift(item);
        this.saveItems();
        return item;
    }

    getItems() {
        return this.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveItems();
    }
}

function initializeWishlist() {
    console.log('Initializing wishlist...');
    
    const wishlistManager = new WishlistManager();
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowForm = urlParams.get('add') === '1';
    
    console.log('Should show form:', shouldShowForm);

    if (shouldShowForm) {
        console.log('Showing add item form...');
        showAddItemForm();
    } else {
        console.log('Rendering wishlist items...');
        renderWishlistItems();
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
                <h2 class="card-title">Добавить в вишлист</h2>
                <form id="wishlist-form">
                    <div class="form-group">
                        <label for="item-title">Название:</label>
                        <input type="text" id="item-title" required placeholder="Введите название желаемого">
                    </div>
                    <div class="form-group">
                        <label for="item-link">Ссылка:</label>
                        <input type="url" id="item-link" placeholder="https://example.com/item">
                    </div>
                    <div class="form-group" id="image-preview-group" style="display: none;">
                        <label>Предпросмотр изображения:</label>
                        <div id="image-preview-container">
                            <img id="preview-image" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                        </div>
                    </div>
                    <div class="form-group" id="custom-image-group" style="display: none;">
                        <label for="item-image">Загрузить свое фото:</label>
                        <input type="file" id="item-image" accept="image/*">
                        <div id="custom-image-preview"></div>
                    </div>
                    <div class="form-group">
                        <label for="item-description">Описание:</label>
                        <textarea id="item-description" rows="4" placeholder="Опишите, почему вы этого хотите или любая другая информация"></textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">Сохранить</button>
                        <button type="button" class="btn-secondary" onclick="hideAddWishlistForm()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        console.log('Setting form HTML...');
        contentSection.innerHTML = formHTML;
        console.log('Form HTML set');
        
        // Обработчик для ссылки - попытка получить изображение
        const linkInput = document.getElementById('item-link');
        linkInput.addEventListener('blur', function() {
            const url = this.value.trim();
            if (url) {
                tryLinkImage(url);
            } else {
                hideImageOptions();
            }
        });
        
        // Обработчик для загрузки своего фото
        const imageInput = document.getElementById('item-image');
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const customImagePreview = document.getElementById('custom-image-preview');
                    customImagePreview.innerHTML = `
                        <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Обработчик формы
        const form = document.getElementById('wishlist-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const customImagePreview = document.getElementById('custom-image-preview');
                const customImage = customImagePreview.querySelector('img');
                
                const itemData = {
                    title: document.getElementById('item-title').value,
                    link: document.getElementById('item-link').value || '',
                    imageUrl: customImage ? customImage.src : '',
                    description: document.getElementById('item-description').value
                };
                
                console.log('Submitting item:', itemData);
                wishlistManager.addItem(itemData);
                hideAddWishlistForm();
                renderWishlistItems();
            });
            console.log('Form event listener added');
        } else {
            console.error('Form not found after setting HTML!');
        }
    }

    function tryLinkImage(url) {
        // Пробуем получить Open Graph изображение или просто главную картинку
        console.log('Trying to get image from URL:', url);
        
        // Показываем группу для предпросмотра
        document.getElementById('image-preview-group').style.display = 'block';
        
        // Для простоты используем заглушку, в реальном проекте здесь был бы запрос к API
        const previewImage = document.getElementById('preview-image');
        previewImage.src = 'https://via.placeholder.com/200x200?text=Загрузка...';
        
        // Показываем опцию загрузки своего фото
        document.getElementById('custom-image-group').style.display = 'block';
        
        // Имитация загрузки (в реальности здесь был бы fetch к API)
        setTimeout(() => {
            previewImage.src = 'https://via.placeholder.com/200x200?text=Нет+изображения';
        }, 1000);
    }
    
    function hideImageOptions() {
        document.getElementById('image-preview-group').style.display = 'none';
        document.getElementById('custom-image-group').style.display = 'none';
    }

    window.hideAddWishlistForm = function() {
        window.location.href = 'wishlist.html';
    };

    function renderWishlistItems() {
        console.log('renderWishlistItems called');
        const contentSection = document.querySelector('.content');
        console.log('Content section in renderWishlistItems:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found in renderWishlistItems!');
            return;
        }
        
        const items = wishlistManager.getItems();
        console.log('Items count:', items.length);
        
        if (items.length === 0) {
            contentSection.innerHTML = `
                <div class="content-card card">
                    <h2 class="card-title">Вишлист</h2>
                    <p class="content-placeholder">Здесь будут ваши желаемые вещи. Добавить можно с главной страницы.</p>
                </div>
            `;
            return;
        }

        const itemsHTML = items.map(item => createWishlistItemHTML(item)).join('');
        contentSection.innerHTML = `
            <div class="content-card card">
                <h2 class="card-title">Вишлист</h2>
                <div class="wishlist-items">
                    ${itemsHTML}
                </div>
            </div>
        `;

        // Обработчики для удаления
        document.querySelectorAll('.wishlist-item-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = parseInt(this.dataset.itemId);
                if (confirm('Удалить этот item из вишлиста?')) {
                    wishlistManager.deleteItem(itemId);
                    renderWishlistItems();
                }
            });
        });
    }

    function createWishlistItemHTML(item) {
        const createdDate = new Date(item.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const imageHTML = item.imageUrl ? 
            `<img src="${item.imageUrl}" alt="${item.title}" class="wishlist-item-image" onerror="this.style.display='none'">` :
            `<div class="wishlist-item-no-image">🎁</div>`;

        const linkHTML = item.link ? 
            `<a href="${item.link}" target="_blank" class="wishlist-item-link">🔗 Ссылка</a>` : '';

        return `
            <div class="wishlist-item" data-item-id="${item.id}">
                <div class="wishlist-item-header">
                    <div class="wishlist-item-meta">
                        <span class="wishlist-item-author">${item.author}</span>
                        <span class="wishlist-item-date">${createdDate}</span>
                    </div>
                    <button class="wishlist-item-delete" data-item-id="${item.id}">🗑️</button>
                </div>
                <div class="wishlist-item-content">
                    <div class="wishlist-item-image-container">
                        ${imageHTML}
                    </div>
                    <div class="wishlist-item-info">
                        <h3 class="wishlist-item-title">${item.title}</h3>
                        ${linkHTML}
                        ${item.description ? `<p class="wishlist-item-description">${item.description}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}
