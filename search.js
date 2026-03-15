// Универсальный компонент поиска и фильтров
class SearchManager {
    constructor(options = {}) {
        this.options = {
            searchInput: null,
            clearButton: null,
            resultsContainer: null,
            filtersContainer: null,
            items: [],
            searchFields: ['title', 'content', 'description'],
            filters: [],
            onSearch: null,
            onFilter: null,
            onClear: null,
            ...options
        };
        
        this.currentSearch = '';
        this.activeFilters = new Set();
        this.filteredItems = [];
        
        this.init();
    }
    
    init() {
        this.setupSearch();
        this.setupFilters();
        this.bindEvents();
    }
    
    setupSearch() {
        if (this.options.searchInput) {
            this.searchInput = this.options.searchInput;
            this.clearButton = this.options.clearButton;
            this.resultsContainer = this.options.resultsContainer;
            
            // Инициализация иконки поиска
            this.createSearchIcon();
        }
    }
    
    createSearchIcon() {
        const wrapper = this.searchInput.parentElement;
        if (!wrapper.querySelector('.search-icon')) {
            const icon = document.createElement('div');
            icon.className = 'search-icon';
            icon.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
            `;
            wrapper.insertBefore(icon, this.searchInput);
        }
    }
    
    setupFilters() {
        if (this.options.filtersContainer && this.options.filters.length > 0) {
            this.renderFilters();
        }
    }
    
    renderFilters() {
        const container = this.options.filtersContainer;
        container.innerHTML = '';
        
        this.options.filters.forEach(filter => {
            const chip = document.createElement('button');
            chip.className = 'filter-chip';
            chip.textContent = filter.label;
            chip.dataset.filter = filter.value;
            
            if (this.activeFilters.has(filter.value)) {
                chip.classList.add('active');
            }
            
            chip.addEventListener('click', () => this.toggleFilter(filter.value));
            container.appendChild(chip);
        });
    }
    
    bindEvents() {
        if (this.searchInput) {
            // Поиск при вводе
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            // Поиск при Enter
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch(e.target.value);
                }
            });
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.clearSearch());
        }
    }
    
    handleSearch(query) {
        this.currentSearch = query.toLowerCase().trim();
        this.updateClearButton();
        this.performSearch();
    }
    
    performSearch() {
        let filtered = [...this.options.items];
        
        // Применяем текстовый поиск
        if (this.currentSearch) {
            filtered = filtered.filter(item => {
                return this.searchFields.some(field => {
                    const value = this.getNestedValue(item, field);
                    return value && value.toLowerCase().includes(this.currentSearch);
                });
            });
        }
        
        // Применяем фильтры
        if (this.activeFilters.size > 0) {
            filtered = filtered.filter(item => {
                return Array.from(this.activeFilters).some(filter => 
                    this.matchesFilter(item, filter)
                );
            });
        }
        
        this.filteredItems = filtered;
        this.renderResults();
        
        if (this.options.onSearch) {
            this.options.onSearch(this.currentSearch, this.filteredItems);
        }
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key] ? current[key] : null, obj
        );
    }
    
    matchesFilter(item, filter) {
        // Базовая логика фильтрации - можно переопределить
        const filterConfig = this.options.filters.find(f => f.value === filter);
        if (!filterConfig) return false;
        
        return filterConfig.matcher ? filterConfig.matcher(item) : true;
    }
    
    toggleFilter(filterValue) {
        if (this.activeFilters.has(filterValue)) {
            this.activeFilters.delete(filterValue);
        } else {
            this.activeFilters.add(filterValue);
        }
        
        this.updateFilterButtons();
        this.performSearch();
        
        if (this.options.onFilter) {
            this.options.onFilter(Array.from(this.activeFilters), this.filteredItems);
        }
    }
    
    updateFilterButtons() {
        const buttons = this.options.filtersContainer.querySelectorAll('.filter-chip');
        buttons.forEach(button => {
            const filter = button.dataset.filter;
            if (this.activeFilters.has(filter)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    updateClearButton() {
        if (this.clearButton) {
            if (this.currentSearch || this.activeFilters.size > 0) {
                this.clearButton.classList.add('visible');
            } else {
                this.clearButton.classList.remove('visible');
            }
        }
    }
    
    clearSearch() {
        this.currentSearch = '';
        this.activeFilters.clear();
        
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        this.updateClearButton();
        this.updateFilterButtons();
        this.performSearch();
        
        if (this.options.onClear) {
            this.options.onClear();
        }
    }
    
    renderResults() {
        if (!this.resultsContainer) return;
        
        if (this.filteredItems.length === 0) {
            this.renderNoResults();
        } else {
            this.renderResultsList();
        }
    }
    
    renderNoResults() {
        this.resultsContainer.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">🔍</div>
                <div>Ничего не найдено</div>
                <div style="font-size: 13px; margin-top: 8px; color: #999;">
                    Попробуйте изменить поисковый запрос или фильтры
                </div>
            </div>
        `;
    }
    
    renderResultsList() {
        const countInfo = document.createElement('div');
        countInfo.className = 'search-results-count';
        countInfo.textContent = `Найдено: ${this.filteredItems.length} ${this.getWordForm(this.filteredItems.length)}`;
        
        this.resultsContainer.innerHTML = '';
        this.resultsContainer.appendChild(countInfo);
        
        // Здесь можно добавить кастомную логику рендеринга результатов
        if (this.options.renderResults) {
            this.options.renderResults(this.filteredItems, this.resultsContainer);
        }
    }
    
    getWordForm(count) {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            return 'записей';
        }
        
        if (lastDigit === 1) {
            return 'запись';
        }
        
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'записи';
        }
        
        return 'записей';
    }
    
    highlightText(text, search) {
        if (!search || !text) return text;
        
        const regex = new RegExp(`(${search})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    setItems(items) {
        this.options.items = items;
        this.performSearch();
    }
    
    addItems(items) {
        this.options.items.push(...items);
        this.performSearch();
    }
    
    updateItem(updatedItem) {
        const index = this.options.items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
            this.options.items[index] = updatedItem;
            this.performSearch();
        }
    }
    
    removeItem(itemId) {
        this.options.items = this.options.items.filter(item => item.id !== itemId);
        this.performSearch();
    }
    
    getCurrentSearch() {
        return this.currentSearch;
    }
    
    getActiveFilters() {
        return Array.from(this.activeFilters);
    }
    
    getFilteredItems() {
        return this.filteredItems;
    }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
} else if (typeof window !== 'undefined') {
    window.SearchManager = SearchManager;
}
