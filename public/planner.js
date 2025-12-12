/**
 * PLANNER.JS - Meal Planner functionality
 * Manages selected items and calculates total nutritional values
 */

// Store selected items
window.selectedMealItems = [];

// Session ID for logged-out users
let sessionId = null;

// Generate or retrieve session ID
function getSessionId() {
  if (!sessionId) {
    // Check localStorage for existing session ID
    sessionId = localStorage.getItem('plannerSessionId');
    
    if (!sessionId) {
      // Generate new UUID-style session ID
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('plannerSessionId', sessionId);
    }
  }
  return sessionId;
}

// Auto-save to MongoDB
let autoSaveTimeout = null;
async function autoSaveToDatabase() {
  // Clear any pending timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  
  // Debounce - wait 500ms after last change before saving
  autoSaveTimeout = setTimeout(async () => {
    try {
      const totalNutrition = calculateTotalNutrition();
      
      const plannerData = {
        items: JSON.parse(JSON.stringify(window.selectedMealItems)),
        mealName: window.mealName || 'My Meal Planner',
        totalNutrition: JSON.parse(JSON.stringify(totalNutrition)),
        sessionId: getSessionId()
      };
      
      const response = await fetch('/api/active-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(plannerData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Auto-saved planner state to', data.authenticated ? 'savedLogin' : 'savedLogoff');
      } else {
        console.warn('Auto-save failed:', data.error);
      }
    } catch (error) {
      console.error('Error auto-saving to database:', error);
    }
  }, 500);
}

// Add item to planner
window.addToPlanner = function(itemData, itemId) {
  // Check if item already exists
  const existingIndex = window.selectedMealItems.findIndex(item => item.id === itemId);
  
  if (existingIndex >= 0) {
    // Remove item if already selected
    window.selectedMealItems.splice(existingIndex, 1);
    updatePlannerUI();
    autoSaveToDatabase(); // Auto-save after change
    return false;
  } else {
    // Add new item
    window.selectedMealItems.push({
      id: itemId,
      data: itemData
    });
    updatePlannerUI();
    autoSaveToDatabase(); // Auto-save after change
    return true;
  }
};

// Remove item from planner
function removeFromPlanner(itemId) {
  window.selectedMealItems = window.selectedMealItems.filter(item => item.id !== itemId);
  updatePlannerUI();
  autoSaveToDatabase(); // Auto-save after change
}

// Update the planner UI
function updatePlannerUI() {
  const container = document.getElementById('selected-items');
  
  if (window.selectedMealItems.length === 0) {
    container.innerHTML = '<p class="empty-state">Click on items to add them to your meal plan</p>';
    updateTotals();
    autoSaveToLocalStorage();
    return;
  }
  
  // Clear empty state
  container.innerHTML = '';
  
  // Add each selected item
  window.selectedMealItems.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('planner-item');
    itemDiv.dataset.itemId = item.id;
    
    const itemName = item.data.ITEM || 'Unknown Item';
    const calories = item.data.CAL || '0';
    const protein = item.data.PRO || '0';
    const carbs = item.data.CARB || '0';
    const fat = item.data.FAT || '0';
    const saturatedFat = item.data.SFAT || '0';
    const transFat = item.data.TFAT || '0';
    const cholesterol = item.data.CHOL || '0';
    const sodium = item.data.SALT || '0';
    const fiber = item.data.FBR || '0';
    const sugar = item.data.SGR || '0';
    
    itemDiv.innerHTML = DOMPurify.sanitize(`
      <div class="planner-item-content">
        <div class="planner-item-header">
          <div class="planner-item-summary">
            <div class="planner-item-name">${itemName}</div>
            <div class="planner-item-calories">${calories} cal</div>
          </div>
          <div class="planner-item-actions">
            <button class="expand-item-btn" data-item-id="${item.id}">▼</button>
            <button class="remove-item-btn" data-item-id="${item.id}">&times;</button>
          </div>
        </div>
        <div class="planner-item-nutrition collapsed">
          <div class="nutrition-column">
            <div class="nutrition-item">
              <span class="nutrition-item-label">Calories</span>
              <span class="nutrition-item-value">${calories}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Protein</span>
              <span class="nutrition-item-value">${protein}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Carbs</span>
              <span class="nutrition-item-value">${carbs}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Fat</span>
              <span class="nutrition-item-value">${fat}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Sat Fat</span>
              <span class="nutrition-item-value">${saturatedFat}g</span>
            </div>
          </div>
          <div class="nutrition-column">
            <div class="nutrition-item">
              <span class="nutrition-item-label">Trans Fat</span>
              <span class="nutrition-item-value">${transFat}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Cholesterol</span>
              <span class="nutrition-item-value">${cholesterol}mg</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Sodium</span>
              <span class="nutrition-item-value">${sodium}mg</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Fiber</span>
              <span class="nutrition-item-value">${fiber}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-item-label">Sugar</span>
              <span class="nutrition-item-value">${sugar}g</span>
            </div>
          </div>
        </div>
      </div>
    `);
    
    container.appendChild(itemDiv);
  });
  
  // Add event listeners to expand buttons
  container.querySelectorAll('.expand-item-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const itemId = this.dataset.itemId;
      const plannerItem = this.closest('.planner-item');
      const nutritionSection = plannerItem.querySelector('.planner-item-nutrition');
      
      if (nutritionSection.classList.contains('collapsed')) {
        nutritionSection.classList.remove('collapsed');
        this.textContent = '▲';
        this.classList.add('expanded');
      } else {
        nutritionSection.classList.add('collapsed');
        this.textContent = '▼';
        this.classList.remove('expanded');
      }
    });
  });
  
  // Add event listeners to remove buttons
  container.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const itemId = this.dataset.itemId;
      removeFromPlanner(itemId);
      
      // Update the visual state of the menu item - find button with matching data-popup-id
      const menuItemButton = document.querySelector(`.open[data-popup-id="${itemId}"]`);
      if (menuItemButton) {
        menuItemButton.classList.remove('selected');
      }
    });
  });
  
  // Update totals
  updateTotals();
  
  // Auto-save to localStorage (backup)
  autoSaveToLocalStorage();
  
  // Note: autoSaveToDatabase is called from addToPlanner/removeFromPlanner
  // to avoid triggering on every UI refresh
}

// Calculate and update total nutritional values
function updateTotals() {
  let totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    fiber: 0,
    sugar: 0
  };
  
  window.selectedMealItems.forEach(item => {
    const data = item.data;
    totals.calories += parseFloat(data.CAL) || 0;
    totals.protein += parseFloat(data.PRO) || 0;
    totals.carbs += parseFloat(data.CARB) || 0;
    totals.fat += parseFloat(data.FAT) || 0;
    totals.saturatedFat += parseFloat(data.SFAT) || 0;
    totals.transFat += parseFloat(data.TFAT) || 0;
    totals.cholesterol += parseFloat(data.CHOL) || 0;
    totals.sodium += parseFloat(data.SALT) || 0;
    totals.fiber += parseFloat(data.FBR) || 0;
    totals.sugar += parseFloat(data.SGR) || 0;
  });
  
  // Update display
  const totalsGrid = document.getElementById('totals-grid');
  totalsGrid.innerHTML = DOMPurify.sanitize(`
    <div class="totals-column">
      <div class="total-row">
        <span class="total-label">Calories</span>
        <span class="total-value">${Math.round(totals.calories)}</span>
      </div>
      <div class="total-row">
        <span class="total-label">Protein</span>
        <span class="total-value">${totals.protein.toFixed(1)}g</span>
      </div>
      <div class="total-row">
        <span class="total-label">Carbs</span>
        <span class="total-value">${totals.carbs.toFixed(1)}g</span>
      </div>
      <div class="total-row">
        <span class="total-label">Fat</span>
        <span class="total-value">${totals.fat.toFixed(1)}g</span>
      </div>
      <div class="total-row">
        <span class="total-label">Sat Fat</span>
        <span class="total-value">${totals.saturatedFat.toFixed(1)}g</span>
      </div>
    </div>
    <div class="totals-column">
      <div class="total-row">
        <span class="total-label">Trans Fat</span>
        <span class="total-value">${totals.transFat.toFixed(1)}g</span>
      </div>
      <div class="total-row">
        <span class="total-label">Cholesterol</span>
        <span class="total-value">${Math.round(totals.cholesterol)}mg</span>
      </div>
      <div class="total-row">
        <span class="total-label">Sodium</span>
        <span class="total-value">${Math.round(totals.sodium)}mg</span>
      </div>
      <div class="total-row">
        <span class="total-label">Fiber</span>
        <span class="total-value">${totals.fiber.toFixed(1)}g</span>
      </div>
      <div class="total-row">
        <span class="total-label">Sugar</span>
        <span class="total-value">${totals.sugar.toFixed(1)}g</span>
      </div>
    </div>
  `);
}

// Check if item is selected
window.isItemSelected = function(itemId) {
  return window.selectedMealItems.some(item => item.id === itemId);
};

// Clear all selected items
window.clearAllItems = async function() {
  // Remove selected class from all menu items
  window.selectedMealItems.forEach(item => {
    const menuItem = document.querySelector(`.open[data-popup-id="${item.id}"]`);
    if (menuItem) {
      menuItem.classList.remove('selected');
    }
  });
  
  // Clear the array
  window.selectedMealItems = [];
  updatePlannerUI();
  
  // Clear from database
  try {
    const response = await fetch(`/api/active-planner?sessionId=${getSessionId()}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Cleared active planner from database');
    }
  } catch (error) {
    console.error('Error clearing planner from database:', error);
  }
};

// Save meal functionality
window.saveMeal = function() {
  if (window.selectedMealItems.length === 0) {
    alert('Please add items to your meal plan before saving.');
    return;
  }
  
  try {
    // Calculate total nutrition
    const totalNutrition = calculateTotalNutrition();
    
    // Prepare meal data
    const mealData = {
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15),
      mealName: window.mealName || 'My Meal Planner',
      items: JSON.parse(JSON.stringify(window.selectedMealItems)),
      totalNutrition: JSON.parse(JSON.stringify(totalNutrition)),
      createdAt: new Date().toISOString()
    };
    
    // Get existing saved meals from localStorage
    let savedMeals = [];
    const existing = localStorage.getItem('savedMeals');
    if (existing) {
      savedMeals = JSON.parse(existing);
    }
    
    // Add new meal
    savedMeals.push(mealData);
    
    // Save back to localStorage
    localStorage.setItem('savedMeals', JSON.stringify(savedMeals));
    
    alert('Meal saved successfully!');
    console.log('Meal saved to localStorage:', mealData.id);
  } catch (error) {
    console.error('Error saving meal:', error);
    alert('Error saving meal: ' + error.message);
  }
};

// Calculate total nutrition values
function calculateTotalNutrition() {
  let totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    fiber: 0,
    sugar: 0
  };
  
  window.selectedMealItems.forEach(item => {
    const data = item.data;
    totals.calories += parseFloat(data.CAL) || 0;
    totals.protein += parseFloat(data.PRO) || 0;
    totals.carbs += parseFloat(data.CARB) || 0;
    totals.fat += parseFloat(data.FAT) || 0;
    totals.saturatedFat += parseFloat(data.SFAT) || 0;
    totals.transFat += parseFloat(data.TFAT) || 0;
    totals.cholesterol += parseFloat(data.CHOL) || 0;
    totals.sodium += parseFloat(data.SALT) || 0;
    totals.fiber += parseFloat(data.FBR) || 0;
    totals.sugar += parseFloat(data.SGR) || 0;
  });
  
  return totals;
}

// Auto-save to localStorage for logged-out users
function autoSaveToLocalStorage() {
  try {
    const mealData = {
      items: window.selectedMealItems,
      mealName: window.mealName,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('unsavedMeal', JSON.stringify(mealData));
  } catch (error) {
    console.error('Error auto-saving to localStorage:', error);
  }
}

// Load from localStorage on page load
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('unsavedMeal');
    if (saved) {
      const mealData = JSON.parse(saved);
      
      // Only restore if meal is recent (within 7 days)
      const savedDate = new Date(mealData.timestamp);
      const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 7 && mealData.items && mealData.items.length > 0) {
        window.selectedMealItems = mealData.items;
        window.mealName = mealData.mealName || 'My Meal Planner';
        
        // Update UI
        const mealNameElement = document.getElementById('meal-name');
        if (mealNameElement) {
          mealNameElement.textContent = window.mealName;
        }
        
        updatePlannerUI();
        
        // Update visual state of menu items
        window.selectedMealItems.forEach(item => {
          const menuItem = document.querySelector(`.open[data-popup-id="${item.id}"]`);
          if (menuItem) {
            menuItem.classList.add('selected');
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
}

// Check for pending meal after login
async function checkPendingMeal() {
  const pendingMeal = sessionStorage.getItem('pendingMeal');
  if (pendingMeal) {
    try {
      const mealData = JSON.parse(pendingMeal);
      
      // Restore meal
      window.selectedMealItems = mealData.items;
      window.mealName = mealData.mealName;
      
      // Update UI
      const mealNameElement = document.getElementById('meal-name');
      if (mealNameElement) {
        mealNameElement.textContent = window.mealName;
      }
      
      updatePlannerUI();
      
      // Auto-save the meal
      await window.saveMeal();
    } catch (error) {
      console.error('Error restoring pending meal:', error);
    }
  }
}

// Check for meal to load from saved meals page
function checkLoadMeal() {
  const loadMeal = sessionStorage.getItem('loadMeal');
  if (loadMeal) {
    try {
      const meal = JSON.parse(loadMeal);
      
      // Load meal items
      window.selectedMealItems = meal.items;
      window.mealName = meal.mealName;
      
      // Update UI
      const mealNameElement = document.getElementById('meal-name');
      if (mealNameElement) {
        mealNameElement.textContent = window.mealName;
      }
      
      updatePlannerUI();
      
      // Update visual state of menu items
      window.selectedMealItems.forEach(item => {
        const menuItem = document.querySelector(`.open[data-popup-id="${item.id}"]`);
        if (menuItem) {
          menuItem.classList.add('selected');
        }
      });
      
      // Clear the session storage
      sessionStorage.removeItem('loadMeal');
      
      alert(`Loaded meal: ${meal.mealName}`);
    } catch (error) {
      console.error('Error loading meal:', error);
    }
  }
}

// Meal name editing
window.mealName = 'My Meal Planner';

function setupMealNameEditing() {
  const editBtn = document.getElementById('edit-meal-name-btn');
  const mealNameElement = document.getElementById('meal-name');
  
  if (!editBtn || !mealNameElement) return;
  
  // Function to enable editing
  function enableEditing() {
    if (mealNameElement.getAttribute('contenteditable') === 'false') {
      mealNameElement.setAttribute('contenteditable', 'true');
      mealNameElement.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(mealNameElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  // Function to disable editing and save
  function disableEditing() {
    const oldName = window.mealName;
    mealNameElement.setAttribute('contenteditable', 'false');
    window.mealName = mealNameElement.textContent.trim() || 'My Meal Planner';
    mealNameElement.textContent = window.mealName;
    
    // Auto-save to database if name changed
    if (oldName !== window.mealName) {
      autoSaveToDatabase();
    }
  }
  
  // Click on pencil icon to toggle editing
  editBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (mealNameElement.getAttribute('contenteditable') === 'false') {
      enableEditing();
    } else {
      disableEditing();
    }
  });
  
  // Click on meal name to enable editing
  mealNameElement.addEventListener('click', function() {
    enableEditing();
  });
  
  // Handle Enter key to save
  mealNameElement.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      mealNameElement.setAttribute('contenteditable', 'false');
      window.mealName = mealNameElement.textContent.trim() || 'My Meal Planner';
      mealNameElement.textContent = window.mealName;
    }
    // Handle Escape key to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      mealNameElement.textContent = window.mealName;
      mealNameElement.setAttribute('contenteditable', 'false');
    }
  });
  
  // Handle blur (clicking outside)
  mealNameElement.addEventListener('blur', function() {
    setTimeout(() => {
      if (mealNameElement.getAttribute('contenteditable') === 'true') {
        mealNameElement.setAttribute('contenteditable', 'false');
        window.mealName = mealNameElement.textContent.trim() || 'My Meal Planner';
        mealNameElement.textContent = window.mealName;
      }
    }, 100);
  });
}

// Load active planner state from database
async function loadActivePlanner() {
  try {
    const response = await fetch(`/api/active-planner?sessionId=${getSessionId()}`);
    const data = await response.json();
    
    if (data.success && data.planner) {
      const planner = data.planner;
      
      // Restore planner state
      window.selectedMealItems = planner.items || [];
      window.mealName = planner.mealName || 'My Meal Planner';
      
      // Update UI
      const mealNameElement = document.getElementById('meal-name');
      if (mealNameElement) {
        mealNameElement.textContent = window.mealName;
      }
      
      updatePlannerUI();
      
      // Update visual state of menu items
      window.selectedMealItems.forEach(item => {
        const menuItem = document.querySelector(`.open[data-popup-id="${item.id}"]`);
        if (menuItem) {
          menuItem.classList.add('selected');
        }
      });
      
      console.log('Loaded active planner from', data.authenticated ? 'savedLogin' : 'savedLogoff');
    } else {
      // No saved planner, try loading from localStorage as fallback
      loadFromLocalStorage();
    }
  } catch (error) {
    console.error('Error loading active planner:', error);
    // Fallback to localStorage
    loadFromLocalStorage();
  }
}

// Initialize planner buttons
document.addEventListener('DOMContentLoaded', async function() {
  const clearBtn = document.getElementById('clear-all-btn');
  const saveBtn = document.getElementById('save-meal-btn');
  
  if (clearBtn) {
    clearBtn.addEventListener('click', window.clearAllItems);
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', window.saveMeal);
  }
  
  // Setup meal name editing
  setupMealNameEditing();
  
  // Check for meal to load from saved meals page (highest priority)
  const hasLoadMeal = sessionStorage.getItem('loadMeal');
  if (hasLoadMeal) {
    checkLoadMeal();
  } else {
    // Check for pending meal after login (second priority)
    const hasPendingMeal = sessionStorage.getItem('pendingMeal');
    if (hasPendingMeal) {
      await checkPendingMeal();
    } else {
      // Load active planner from database (normal case)
      await loadActivePlanner();
    }
  }
});
