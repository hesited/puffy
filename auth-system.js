// Система управления пользователями и авторизации
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 часа
        this.init();
    }

    init() {
        // Проверяем сессию при загрузке
        this.checkSession();
        
        // Устанавливаем обработчик для отслеживания активности
        this.setupActivityTracking();
    }

    // Регистрация нового пользователя
    async register(userData) {
        const { username, email, password, confirmPassword } = userData;
        
        // Валидация
        const validation = this.validateRegistrationData(userData);
        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        // Проверяем, что пользователь еще не существует
        if (this.userExists(username)) {
            return { success: false, error: 'Пользователь с таким именем уже существует' };
        }

        if (this.emailExists(email)) {
            return { success: false, error: 'Пользователь с таким email уже существует' };
        }

        // Создаем нового пользователя
        const user = {
            id: Date.now(),
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            profile: {
                firstName: '',
                lastName: '',
                avatar: '',
                bio: ''
            },
            settings: {
                theme: 'light',
                notifications: true,
                language: 'ru'
            },
            stats: {
                notesCount: 0,
                wishlistCount: 0,
                recipesCount: 0,
                todosCount: 0,
                mediatekaCount: 0
            }
        };

        // Сохраняем пользователя
        this.saveUser(user);
        
        return { 
            success: true, 
            message: 'Регистрация успешна! Теперь вы можете войти в систему.',
            user: this.sanitizeUser(user)
        };
    }

    // Вход в систему
    async login(credentials) {
        const { username, password, remember = false } = credentials;
        
        if (!username || !password) {
            return { success: false, error: 'Введите имя пользователя и пароль' };
        }

        // Ищем пользователя
        const user = this.findUser(username);
        if (!user) {
            return { success: false, error: 'Неверное имя пользователя или пароль' };
        }

        // Проверяем пароль
        if (!this.verifyPassword(password, user.password)) {
            return { success: false, error: 'Неверное имя пользователя или пароль' };
        }

        // Обновляем время последнего входа
        user.lastLogin = new Date().toISOString();
        this.saveUser(user);

        // Создаем сессию
        this.createSession(user, remember);
        
        return { 
            success: true, 
            message: 'Вход выполнен успешно!',
            user: this.sanitizeUser(user)
        };
    }

    // Выход из системы
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('sessionExpires');
        localStorage.removeItem('rememberMe');
        
        // Очищаем данные пользователя из памяти
        this.clearUserData();
        
        return { success: true, message: 'Вы вышли из системы' };
    }

    // Проверка сессии
    checkSession() {
        const sessionToken = localStorage.getItem('sessionToken');
        const sessionExpires = localStorage.getItem('sessionExpires');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        if (!sessionToken) {
            return false;
        }

        // Проверяем время жизни сессии
        if (sessionExpires && new Date(sessionExpires) < new Date()) {
            this.logout();
            return false;
        }

        // Восстанавливаем пользователя
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.loadUserData();
                
                // Обновляем время сессии если не "запомнить меня"
                if (!rememberMe) {
                    this.extendSession();
                }
                
                return true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
                return false;
            }
        }
        
        return false;
    }

    // Создание сессии
    createSession(user, remember = false) {
        const sessionToken = this.generateSessionToken();
        const expires = new Date(Date.now() + this.sessionTimeout).toISOString();
        
        this.currentUser = user;
        
        localStorage.setItem('currentUser', JSON.stringify(this.sanitizeUser(user)));
        localStorage.setItem('sessionToken', sessionToken);
        localStorage.setItem('sessionExpires', expires);
        localStorage.setItem('rememberMe', remember.toString());
        
        this.loadUserData();
    }

    // Продление сессии
    extendSession() {
        const expires = new Date(Date.now() + this.sessionTimeout).toISOString();
        localStorage.setItem('sessionExpires', expires);
    }

    // Генерация токена сессии
    generateSessionToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    // Валидация данных регистрации
    validateRegistrationData(data) {
        const { username, email, password, confirmPassword } = data;
        
        // Имя пользователя
        if (!username || username.length < 3) {
            return { isValid: false, error: 'Имя пользователя должно содержать минимум 3 символа' };
        }
        
        if (username.length > 20) {
            return { isValid: false, error: 'Имя пользователя должно содержать максимум 20 символов' };
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { isValid: false, error: 'Имя пользователя может содержать только буквы, цифры и подчеркивания' };
        }
        
        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return { isValid: false, error: 'Введите корректный email адрес' };
        }
        
        // Пароль
        if (!password || password.length < 6) {
            return { isValid: false, error: 'Пароль должен содержать минимум 6 символов' };
        }
        
        if (password.length > 50) {
            return { isValid: false, error: 'Пароль должен содержать максимум 50 символов' };
        }
        
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return { isValid: false, error: 'Пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру' };
        }
        
        // Подтверждение пароля
        if (password !== confirmPassword) {
            return { isValid: false, error: 'Пароли не совпадают' };
        }
        
        return { isValid: true };
    }

    // Проверка существования пользователя
    userExists(username) {
        const users = this.getAllUsers();
        return users.some(user => user.username === username.toLowerCase());
    }

    // Проверка существования email
    emailExists(email) {
        const users = this.getAllUsers();
        return users.some(user => user.email === email.toLowerCase());
    }

    // Поиск пользователя
    findUser(username) {
        const users = this.getAllUsers();
        return users.find(user => 
            user.username === username.toLowerCase() || 
            user.email === username.toLowerCase()
        );
    }

    // Получение всех пользователей
    getAllUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    // Сохранение пользователя
    saveUser(user) {
        const users = this.getAllUsers();
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        if (existingIndex !== -1) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Загрузка данных пользователя
    loadUserData() {
        if (!this.currentUser) return;
        
        // Загружаем все данные пользователя
        this.loadNotes();
        this.loadWishlist();
        this.loadRecipes();
        this.loadTodos();
        this.loadMediateka();
    }

    // Очистка данных пользователя
    clearUserData() {
        // Сохраняем данные перед выходом
        if (this.currentUser) {
            this.saveNotes();
            this.saveWishlist();
            this.saveRecipes();
            this.saveTodos();
            this.saveMediateka();
        }
        
        // Очищаем память
        this.notes = [];
        this.wishlist = [];
        this.recipes = [];
        this.todos = [];
        this.mediateka = [];
    }

    // Методы для работы с данными пользователя
    loadNotes() {
        const key = `notes_${this.currentUser.id}`;
        this.notes = JSON.parse(localStorage.getItem(key)) || [];
    }

    saveNotes() {
        if (this.currentUser && this.notes) {
            const key = `notes_${this.currentUser.id}`;
            localStorage.setItem(key, JSON.stringify(this.notes));
            
            // Обновляем статистику
            this.currentUser.stats.notesCount = this.notes.length;
            this.saveUser(this.currentUser);
        }
    }

    loadWishlist() {
        const key = `wishlist_${this.currentUser.id}`;
        this.wishlist = JSON.parse(localStorage.getItem(key)) || [];
    }

    saveWishlist() {
        if (this.currentUser && this.wishlist) {
            const key = `wishlist_${this.currentUser.id}`;
            localStorage.setItem(key, JSON.stringify(this.wishlist));
            
            this.currentUser.stats.wishlistCount = this.wishlist.length;
            this.saveUser(this.currentUser);
        }
    }

    loadRecipes() {
        const key = `recipes_${this.currentUser.id}`;
        this.recipes = JSON.parse(localStorage.getItem(key)) || [];
    }

    saveRecipes() {
        if (this.currentUser && this.recipes) {
            const key = `recipes_${this.currentUser.id}`;
            localStorage.setItem(key, JSON.stringify(this.recipes));
            
            this.currentUser.stats.recipesCount = this.recipes.length;
            this.saveUser(this.currentUser);
        }
    }

    loadTodos() {
        const key = `todos_${this.currentUser.id}`;
        this.todos = JSON.parse(localStorage.getItem(key)) || [];
    }

    saveTodos() {
        if (this.currentUser && this.todos) {
            const key = `todos_${this.currentUser.id}`;
            localStorage.setItem(key, JSON.stringify(this.todos));
            
            this.currentUser.stats.todosCount = this.todos.length;
            this.saveUser(this.currentUser);
        }
    }

    loadMediateka() {
        const key = `mediateka_${this.currentUser.id}`;
        this.mediateka = JSON.parse(localStorage.getItem(key)) || [];
    }

    saveMediateka() {
        if (this.currentUser && this.mediateka) {
            const key = `mediateka_${this.currentUser.id}`;
            localStorage.setItem(key, JSON.stringify(this.mediateka));
            
            this.currentUser.stats.mediatekaCount = this.mediateka.length;
            this.saveUser(this.currentUser);
        }
    }

    // Хеширование пароля
    hashPassword(password) {
        // Простое хеширование (в реальном проекте использовать bcrypt/scrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return btoa(hash.toString());
    }

    // Проверка пароля
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // Очистка данных пользователя для безопасности
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    // Отслеживание активности пользователя
    setupActivityTracking() {
        let activityTimer;
        
        const resetTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                // Продлеваем сессию при активности
                if (this.currentUser && localStorage.getItem('sessionToken')) {
                    this.extendSession();
                }
            }, 5 * 60 * 1000); // Каждые 5 минут
        };
        
        // Отслеживаем активность
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer();
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }

    // Проверка авторизации
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Обновление профиля пользователя
    updateProfile(profileData) {
        if (!this.currentUser) return { success: false, error: 'Пользователь не авторизован' };
        
        this.currentUser.profile = { ...this.currentUser.profile, ...profileData };
        this.saveUser(this.currentUser);
        
        return { success: true, message: 'Профиль обновлен' };
    }

    // Обновление настроек
    updateSettings(settings) {
        if (!this.currentUser) return { success: false, error: 'Пользователь не авторизован' };
        
        this.currentUser.settings = { ...this.currentUser.settings, ...settings };
        this.saveUser(this.currentUser);
        
        return { success: true, message: 'Настройки обновлены' };
    }
}

// Экспорт для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
} else if (typeof window !== 'undefined') {
    window.AuthSystem = AuthSystem;
}
