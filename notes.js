class NotesManager {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('diaryNotes')) || [];
        this.currentUser = localStorage.getItem('currentUser');
    }

    saveNotes() {
        localStorage.setItem('diaryNotes', JSON.stringify(this.notes));
    }

    addNote(noteData) {
        const note = {
            id: Date.now(),
            author: this.currentUser,
            date: noteData.date,
            location: noteData.location,
            title: noteData.title,
            content: noteData.content,
            createdAt: new Date().toISOString()
        };
        this.notes.unshift(note);
        this.saveNotes();
        return note;
    }

    getNotes() {
        return this.notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
    }
}

function initializeDiary() {
    console.log('Initializing diary...');
    
    const notesManager = new NotesManager();
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowForm = urlParams.get('add') === '1';
    
    console.log('Should show form:', shouldShowForm);

    if (shouldShowForm) {
        console.log('Showing add note form...');
        showAddNoteForm();
    } else {
        console.log('Rendering notes...');
        renderNotes();
    }

    function showAddNoteForm() {
        console.log('showAddNoteForm called');
        const contentSection = document.querySelector('.content');
        console.log('Content section:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found!');
            return;
        }
        
        const formHTML = `
            <div class="content-card card">
                <h2 class="card-title">Добавить запись</h2>
                <form id="note-form">
                    <div class="form-group">
                        <label for="note-date">Дата:</label>
                        <input type="date" id="note-date" required>
                    </div>
                    <div class="form-group">
                        <label for="note-location">Место:</label>
                        <input type="text" id="note-location" placeholder="Местоположение">
                    </div>
                    <div class="form-group">
                        <label for="note-title">Название заметки:</label>
                        <input type="text" id="note-title" required placeholder="Введите название">
                    </div>
                    <div class="form-group">
                        <label for="note-content">Текст заметки:</label>
                        <textarea id="note-content" rows="6" required placeholder="Введите текст заметки"></textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">Сохранить</button>
                        <button type="button" class="btn-secondary" onclick="hideAddNoteForm()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        console.log('Setting form HTML...');
        contentSection.innerHTML = formHTML;
        console.log('Form HTML set');
        
        // Установка текущей даты
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('note-date');
        if (dateInput) {
            dateInput.value = today;
            console.log('Date set to:', today);
        }
        
        // Попытка авто-заполнения местоположения
        if (typeof autoFillLocation === 'function') {
            autoFillLocation();
        } else {
            console.warn('autoFillLocation function not found');
        }
        
        // Обработчик формы
        const form = document.getElementById('note-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const noteData = {
                    date: document.getElementById('note-date').value,
                    location: document.getElementById('note-location').value || 'Не указано',
                    title: document.getElementById('note-title').value,
                    content: document.getElementById('note-content').value
                };
                
                console.log('Submitting note:', noteData);
                notesManager.addNote(noteData);
                hideAddNoteForm();
                renderNotes();
            });
            console.log('Form event listener added');
        } else {
            console.error('Form not found after setting HTML!');
        }
    }

    window.hideAddNoteForm = function() {
        window.location.href = 'diary.html';
    };

    function renderNotes() {
        console.log('renderNotes called');
        const contentSection = document.querySelector('.content');
        console.log('Content section in renderNotes:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found in renderNotes!');
            return;
        }
        
        const notes = notesManager.getNotes();
        console.log('Notes count:', notes.length);
        
        if (notes.length === 0) {
            contentSection.innerHTML = `
                <div class="content-card card">
                    <h2 class="card-title">Записи</h2>
                    <p class="content-placeholder">Здесь будут записи дневника. Добавить запись можно с главной страницы.</p>
                </div>
            `;
            return;
        }

        const notesHTML = notes.map(note => createNoteHTML(note)).join('');
        contentSection.innerHTML = `
            <div class="content-card card">
                <h2 class="card-title">Записи</h2>
                <div class="notes-list">
                    ${notesHTML}
                </div>
            </div>
        `;

        // Добавляем обработчики для раскрытия/сворачивания заметок
        document.querySelectorAll('.note-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const noteId = this.dataset.noteId;
                const noteContent = document.getElementById(`note-content-${noteId}`);
                const isExpanded = noteContent.style.display === 'block';
                
                noteContent.style.display = isExpanded ? 'none' : 'block';
                this.textContent = isExpanded ? '▼' : '▲';
            });
        });

        // Обработчики для удаления заметок
        document.querySelectorAll('.note-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const noteId = parseInt(this.dataset.noteId);
                if (confirm('Удалить эту заметку?')) {
                    notesManager.deleteNote(noteId);
                    renderNotes();
                }
            });
        });
    }

    function createNoteHTML(note) {
        const shortContent = note.content.length > 100 ? 
            note.content.substring(0, 100) + '...' : 
            note.content;
        
        const formattedDate = new Date(note.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-header">
                    <div class="note-meta">
                        <span class="note-author">${note.author}</span>
                        <span class="note-date">${formattedDate}</span>
                        <span class="note-location">📍 ${note.location}</span>
                    </div>
                    <div class="note-actions">
                        <button class="note-toggle" data-note-id="${note.id}">▼</button>
                        <button class="note-delete" data-note-id="${note.id}">🗑️</button>
                    </div>
                </div>
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${shortContent}</div>
                <div class="note-full-content" id="note-content-${note.id}" style="display: none;">
                    <div class="note-full-text">${note.content}</div>
                </div>
            </div>
        `;
    }
}
