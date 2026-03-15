class RecipesManager {
    constructor() {
        this.recipes = JSON.parse(localStorage.getItem('recipes')) || [];
        this.currentUser = localStorage.getItem('currentUser');
    }

    saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(this.recipes));
    }

    addRecipe(recipeData) {
        const recipe = {
            id: Date.now(),
            author: this.currentUser,
            title: recipeData.title,
            ingredients: recipeData.ingredients,
            instructions: recipeData.instructions,
            cookingTime: recipeData.cookingTime,
            servings: recipeData.servings,
            createdAt: new Date().toISOString()
        };
        this.recipes.unshift(recipe);
        this.saveRecipes();
        return recipe;
    }

    getRecipes() {
        return this.recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    deleteRecipe(id) {
        this.recipes = this.recipes.filter(recipe => recipe.id !== id);
        this.saveRecipes();
    }
}

function initializeRecipes() {
    console.log('Initializing recipes...');
    
    const recipesManager = new RecipesManager();
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowForm = urlParams.get('add') === '1';
    
    console.log('Should show form:', shouldShowForm);

    if (shouldShowForm) {
        console.log('Showing add recipe form...');
        showAddRecipeForm();
    } else {
        console.log('Rendering recipes...');
        renderRecipes();
    }

    function showAddRecipeForm() {
        console.log('showAddRecipeForm called');
        const contentSection = document.querySelector('.content');
        console.log('Content section:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found!');
            return;
        }
        
        const formHTML = `
            <div class="content-card card">
                <h2 class="card-title">Добавить рецепт</h2>
                <form id="recipe-form">
                    <div class="form-group">
                        <label for="recipe-title">Название рецепта:</label>
                        <input type="text" id="recipe-title" required placeholder="Введите название">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="cooking-time">Время приготовления:</label>
                            <input type="text" id="cooking-time" placeholder="например: 30 минут">
                        </div>
                        <div class="form-group">
                            <label for="servings">Количество порций:</label>
                            <input type="number" id="servings" placeholder="например: 4">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="ingredients">Ингредиенты:</label>
                        <textarea id="ingredients" rows="4" required placeholder="Введите ингредиенты, каждый с новой строки"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="instructions">Инструкция приготовления:</label>
                        <textarea id="instructions" rows="6" required placeholder="Опишите пошаговый процесс приготовления"></textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">Сохранить</button>
                        <button type="button" class="btn-secondary" onclick="hideAddRecipeForm()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        console.log('Setting form HTML...');
        contentSection.innerHTML = formHTML;
        console.log('Form HTML set');
        
        // Обработчик формы
        const form = document.getElementById('recipe-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const recipeData = {
                    title: document.getElementById('recipe-title').value,
                    ingredients: document.getElementById('ingredients').value,
                    instructions: document.getElementById('instructions').value,
                    cookingTime: document.getElementById('cooking-time').value || 'Не указано',
                    servings: document.getElementById('servings').value || 'Не указано'
                };
                
                console.log('Submitting recipe:', recipeData);
                recipesManager.addRecipe(recipeData);
                hideAddRecipeForm();
                renderRecipes();
            });
            console.log('Form event listener added');
        } else {
            console.error('Form not found after setting HTML!');
        }
    }

    window.hideAddRecipeForm = function() {
        window.location.href = 'recipes.html';
    };

    function renderRecipes() {
        console.log('renderRecipes called');
        const contentSection = document.querySelector('.content');
        console.log('Content section in renderRecipes:', contentSection);
        
        if (!contentSection) {
            console.error('Content section not found in renderRecipes!');
            return;
        }
        
        const recipes = recipesManager.getRecipes();
        console.log('Recipes count:', recipes.length);
        
        if (recipes.length === 0) {
            contentSection.innerHTML = `
                <div class="content-card card">
                    <h2 class="card-title">Рецепты</h2>
                    <p class="content-placeholder">Здесь будут ваши любимые рецепты. Добавить можно с главной страницы.</p>
                </div>
            `;
            return;
        }

        const recipesHTML = recipes.map(recipe => createRecipeHTML(recipe)).join('');
        contentSection.innerHTML = `
            <div class="content-card card">
                <h2 class="card-title">Рецепты</h2>
                <div class="recipes-list">
                    ${recipesHTML}
                </div>
            </div>
        `;

        // Обработчики для удаления
        document.querySelectorAll('.recipe-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const recipeId = parseInt(this.dataset.recipeId);
                if (confirm('Удалить этот рецепт?')) {
                    recipesManager.deleteRecipe(recipeId);
                    renderRecipes();
                }
            });
        });

        // Обработчики для развертывания/сворачивания
        document.querySelectorAll('.recipe-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const recipeId = this.dataset.recipeId;
                const recipeContent = document.getElementById(`recipe-content-${recipeId}`);
                const isExpanded = recipeContent.style.display === 'block';
                
                recipeContent.style.display = isExpanded ? 'none' : 'block';
                this.textContent = isExpanded ? '🍳' : '📖';
            });
        });
    }

    function createRecipeHTML(recipe) {
        const createdDate = new Date(recipe.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const ingredientsList = recipe.ingredients.split('\n').filter(i => i.trim()).map(ing => 
            `<li>${ing.trim()}</li>`
        ).join('');

        return `
            <div class="recipe-item" data-recipe-id="${recipe.id}">
                <div class="recipe-header">
                    <div class="recipe-meta">
                        <span class="recipe-author">${recipe.author}</span>
                        <span class="recipe-date">${createdDate}</span>
                        <span class="recipe-time">⏱️ ${recipe.cookingTime}</span>
                        <span class="recipe-servings">🍽️ ${recipe.servings} порций</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="recipe-toggle" data-recipe-id="${recipe.id}">🍳</button>
                        <button class="recipe-delete" data-recipe-id="${recipe.id}">🗑️</button>
                    </div>
                </div>
                <div class="recipe-title">${recipe.title}</div>
                <div class="recipe-ingredients-preview">
                    <strong>Ингредиенты:</strong> ${recipe.ingredients.substring(0, 100)}${recipe.ingredients.length > 100 ? '...' : ''}
                </div>
                <div class="recipe-full-content" id="recipe-content-${recipe.id}" style="display: none;">
                    <div class="recipe-section">
                        <h4>🥘 Ингредиенты:</h4>
                        <ul class="ingredients-list">
                            ${ingredientsList}
                        </ul>
                    </div>
                    <div class="recipe-section">
                        <h4>📝 Инструкция:</h4>
                        <div class="recipe-instructions">${recipe.instructions.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            </div>
        `;
    }
}
