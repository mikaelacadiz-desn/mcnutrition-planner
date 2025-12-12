/**
 * SAVED-MEALS.JS - Display and manage saved meals
 */

document.addEventListener('DOMContentLoaded', async function() {
  await loadSavedMeals();
});

async function loadSavedMeals() {
  const container = document.getElementById('saved-meals-container');
  
  try {
    // Fetch saved meals from MongoDB
    const response = await fetch('/api/saved-meals');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load meals');
    }
    
    const meals = data.meals || [];
    
    if (meals.length === 0) {
      container.innerHTML = `
        <div class="empty-saved-meals">
          <h3>No saved meals yet</h3>
          <p>Start creating meal plans and save them to see them here!</p>
          <a href="/index.html" class="primary-btn">Create a Meal Plan</a>
        </div>
      `;
      return;
    }
    
    // Sort meals by creation date (newest first)
    meals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Display saved meals
    container.innerHTML = '';
    
    meals.forEach(meal => {
      const mealCard = createMealCard(meal);
      container.appendChild(mealCard);
    });
    
  } catch (error) {
    console.error('Error loading saved meals:', error);
    container.innerHTML = `
      <div class="error-state">
        <h3>Error loading meals</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" class="retry-btn">Try Again</button>
      </div>
    `;
  }
}

function createMealCard(meal) {
  const card = document.createElement('div');
  card.classList.add('meal-card');
  card.dataset.mealId = meal.id;
  
  const createdDate = new Date(meal.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const totalNutrition = meal.totalNutrition;
  const itemCount = meal.items.length;
  
  card.innerHTML = DOMPurify.sanitize(`
    <div class="meal-card-header">
      <h3 class="meal-card-title">${meal.mealName}</h3>
      <div class="meal-card-actions">
        <button class="delete-meal-btn" data-meal-id="${meal.id}" title="Delete meal">
          <img src="assets/trash.svg" alt="Delete" />
        </button>
      </div>
    </div>
    <div class="meal-card-meta">
      <span class="meal-date">${createdDate}</span>
      <span class="meal-item-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
    </div>
    <div class="meal-card-nutrition">
      <div class="nutrition-highlight">
        <span class="nutrition-value">${Math.round(totalNutrition.calories)}</span>
        <span class="nutrition-label">Calories</span>
      </div>
      <div class="nutrition-stat">
        <span class="nutrition-value">${totalNutrition.protein.toFixed(1)}g</span>
        <span class="nutrition-label">Protein</span>
      </div>
      <div class="nutrition-stat">
        <span class="nutrition-value">${totalNutrition.carbs.toFixed(1)}g</span>
        <span class="nutrition-label">Carbs</span>
      </div>
      <div class="nutrition-stat">
        <span class="nutrition-value">${totalNutrition.fat.toFixed(1)}g</span>
        <span class="nutrition-label">Fat</span>
      </div>
    </div>
    <div class="meal-card-items">
      <h4>Items:</h4>
      <ul>
        ${meal.items.map(item => `
          <li>${item.data.ITEM} <span class="item-calories">(${item.data.CAL} cal)</span></li>
        `).join('')}
      </ul>
    </div>
    <div class="meal-card-footer">
      <button class="load-meal-btn" data-meal-id="${meal.id}">Load to Planner</button>
    </div>
  `);
  
  // Add delete event listener
  const deleteBtn = card.querySelector('.delete-meal-btn');
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteMeal(meal.id);
  });
  
  // Add load event listener
  const loadBtn = card.querySelector('.load-meal-btn');
  loadBtn.addEventListener('click', () => {
    loadMealToPlanner(meal);
  });
  
  return card;
}

async function deleteMeal(mealId) {
  if (!confirm('Are you sure you want to delete this meal?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/saved-meals/${mealId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Remove from UI
      const mealCard = document.querySelector(`[data-meal-id="${mealId}"]`);
      if (mealCard) {
        mealCard.remove();
      }
      
      // Check if there are any meals left
      const container = document.getElementById('saved-meals-container');
      if (container.children.length === 0) {
        container.innerHTML = `
          <div class="empty-saved-meals">
            <h3>No saved meals yet</h3>
            <p>Start creating meal plans and save them to see them here!</p>
            <a href="/index.html" class="primary-btn">Create a Meal Plan</a>
          </div>
        `;
      }
    } else {
      throw new Error(data.error || 'Failed to delete meal');
    }
  } catch (error) {
    console.error('Error deleting meal:', error);
    alert('Error deleting meal: ' + error.message);
  }
}

function loadMealToPlanner(meal) {
  // Store meal data in sessionStorage
  sessionStorage.setItem('loadMeal', JSON.stringify(meal));
  
  // Redirect to main page
  window.location.href = '/index.html';
}
