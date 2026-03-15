class TodoListManager {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentUser = localStorage.getItem('currentUser');
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    addTodo(todoData) {
        const todo = {
            id: Date.now(),
            author: this.currentUser,
            title: todoData.title,
            priority: todoData.priority,
            dueDate: todoData.dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.todos.unshift(todo);
        this.saveTodos();
        return todo;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
    }

    getTodos() {
        return this.todos.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
}

function initializeTodoList() {
    console.log('Initializing todo list...');
    
    const todoManager = new TodoListManager();
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowForm = urlParams.get('add') === '1';
    
    console.log('Should show form:', shouldShowForm);

    if (shouldShowForm) {
        console.log('Showing add todo form...');
        showAddTodoForm();
    } else {
        console.log('Rendering todos...');
        renderTodos();
    }

    function showAddTodoForm() {
        console.log('showAddTodoForm called');
        const contentSection = document.querySelector('.content');
        console.log('Content section:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found!');
            return;
        }
        
        const formHTML = `
            <div class="content-card card">
                <h2 class="card-title">Добавить задачу</h2>
                <form id="todo-form">
                    <div class="form-group">
                        <label for="todo-title">Задача:</label>
                        <input type="text" id="todo-title" required placeholder="Введите задачу">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="todo-priority">Приоритет:</label>
                            <select id="todo-priority">
                                <option value="low">Низкий</option>
                                <option value="medium" selected>Средний</option>
                                <option value="high">Высокий</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="todo-due-date">Срок выполнения:</label>
                            <input type="date" id="todo-due-date">
                        </div>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">Сохранить</button>
                        <button type="button" class="btn-secondary" onclick="hideAddTodoForm()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        console.log('Setting form HTML...');
        contentSection.innerHTML = formHTML;
        console.log('Form HTML set');
        
        // Установка текущей даты как минимальной
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('todo-due-date');
        if (dateInput) {
            dateInput.min = today;
            dateInput.value = today;
        }
        
        // Обработчик формы
        const form = document.getElementById('todo-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const todoData = {
                    title: document.getElementById('todo-title').value,
                    priority: document.getElementById('todo-priority').value,
                    dueDate: document.getElementById('todo-due-date').value || ''
                };
                
                console.log('Submitting todo:', todoData);
                todoManager.addTodo(todoData);
                hideAddTodoForm();
                renderTodos();
            });
            console.log('Form event listener added');
        } else {
            console.error('Form not found after setting HTML!');
        }
    }

    window.hideAddTodoForm = function() {
        window.location.href = 'todolist.html';
    };

    function renderTodos() {
        console.log('renderTodos called');
        const contentSection = document.querySelector('.content');
        console.log('Content section in renderTodos:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found in renderTodos!');
            return;
        }
        
        const todos = todoManager.getTodos();
        console.log('Todos count:', todos.length);
        
        if (todos.length === 0) {
            contentSection.innerHTML = `
                <div class="content-card card">
                    <h2 class="card-title">Список дел</h2>
                    <p class="content-placeholder">Здесь будут ваши задачи. Добавить можно с главной страницы.</p>
                </div>
            `;
            return;
        }

        const todosHTML = todos.map(todo => createTodoHTML(todo)).join('');
        contentSection.innerHTML = `
            <div class="content-card card">
                <h2 class="card-title">Список дел</h2>
                <div class="todos-list">
                    ${todosHTML}
                </div>
            </div>
        `;

        // Обработчики для чекбоксов
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const todoId = parseInt(this.dataset.todoId);
                todoManager.toggleTodo(todoId);
                renderTodos();
            });
        });

        // Обработчики для удаления
        document.querySelectorAll('.todo-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const todoId = parseInt(this.dataset.todoId);
                if (confirm('Удалить эту задачу?')) {
                    todoManager.deleteTodo(todoId);
                    renderTodos();
                }
            });
        });
    }

    function createTodoHTML(todo) {
        const createdDate = new Date(todo.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const dueDateHTML = todo.dueDate ? 
            `<span class="todo-due-date">📅 ${new Date(todo.dueDate).toLocaleDateString('ru-RU')}</span>` : '';

        const priorityColors = {
            high: '#ff6b6b',
            medium: '#ffd93d',
            low: '#6bcf7f'
        };

        const priorityLabels = {
            high: 'Высокий',
            medium: 'Средний',
            low: 'Низкий'
        };

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <div class="todo-header">
                    <div class="todo-meta">
                        <span class="todo-author">${todo.author}</span>
                        <span class="todo-date">${createdDate}</span>
                        ${dueDateHTML}
                    </div>
                    <div class="todo-actions">
                        <span class="todo-priority" style="color: ${priorityColors[todo.priority]}">
                            ${priorityLabels[todo.priority]}
                        </span>
                        <button class="todo-delete" data-todo-id="${todo.id}">🗑️</button>
                    </div>
                </div>
                <div class="todo-content">
                    <input type="checkbox" class="todo-checkbox" data-todo-id="${todo.id}" 
                           ${todo.completed ? 'checked' : ''}>
                    <span class="todo-title ${todo.completed ? 'completed-text' : ''}">${todo.title}</span>
                </div>
            </div>
        `;
    }
}
