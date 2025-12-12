/**
 * PROFILE.JS - Nutrition Popup functionality
 * Displays detailed nutritional information for menu items
 */

// Function to open nutrition popup
window.openNutritionPopup = async function(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) {
    console.error('Popup not found:', popupId);
    return;
  }

  // Get the item data
  const itemData = window.menuItemsData?.[popupId];
  if (!itemData) {
    console.error('Item data not found for:', popupId);
    return;
  }

  // Get the popup content area
  const popupContent = popup.querySelector('.popup-content');
  if (!popupContent) {
    console.error('Popup content area not found');
    return;
  }

  // Build the nutrition profile HTML
  const nutritionHTML = createNutritionProfile(itemData);
  popupContent.innerHTML = DOMPurify.sanitize(nutritionHTML);

  // Show the popup
  popup.style.display = 'flex';

  // Close popup when clicking outside the content
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      popup.style.display = 'none';
    }
  });
};

// Create nutrition profile HTML
function createNutritionProfile(item) {
  const itemName = item.ITEM || 'Unknown Item';
  
  // Parse nutritional values
  const calories = item.CAL || '0';
  const protein = item.PRO || '0';
  const carbs = item.CARB || '0';
  const fat = item.FAT || '0';
  const saturatedFat = item.SFAT || '0';
  const transFat = item.TFAT || '0';
  const cholesterol = item.CHOL || '0';
  const sodium = item.SALT || '0';
  const fiber = item.FBR || '0';
  const sugar = item.SGR || '0';

  return `
    <div class="nutrition-popup-header">
      <h2>${itemName}</h2>
      <button class="close-nutrition-popup">&times;</button>
    </div>
    
    <div class="nutrition-content">
      <div class="nutrition-highlight-section">
        <div class="calorie-display">
          <span class="calorie-number">${calories}</span>
          <span class="calorie-label">Calories</span>
        </div>
      </div>

      <div class="nutrition-details">
        <h3>Nutrition Facts</h3>
        
        <div class="nutrition-section">
          <h4>Macronutrients</h4>
          <div class="nutrition-row">
            <span class="nutrition-label">Protein</span>
            <span class="nutrition-value">${protein}g</span>
          </div>
          <div class="nutrition-row">
            <span class="nutrition-label">Carbohydrates</span>
            <span class="nutrition-value">${carbs}g</span>
          </div>
          <div class="nutrition-row">
            <span class="nutrition-label">Total Fat</span>
            <span class="nutrition-value">${fat}g</span>
          </div>
        </div>

        <div class="nutrition-section">
          <h4>Fat Breakdown</h4>
          <div class="nutrition-row sub">
            <span class="nutrition-label">Saturated Fat</span>
            <span class="nutrition-value">${saturatedFat}g</span>
          </div>
          <div class="nutrition-row sub">
            <span class="nutrition-label">Trans Fat</span>
            <span class="nutrition-value">${transFat}g</span>
          </div>
        </div>

        <div class="nutrition-section">
          <h4>Other Nutrients</h4>
          <div class="nutrition-row">
            <span class="nutrition-label">Cholesterol</span>
            <span class="nutrition-value">${cholesterol}mg</span>
          </div>
          <div class="nutrition-row">
            <span class="nutrition-label">Sodium</span>
            <span class="nutrition-value">${sodium}mg</span>
          </div>
          <div class="nutrition-row">
            <span class="nutrition-label">Dietary Fiber</span>
            <span class="nutrition-value">${fiber}g</span>
          </div>
          <div class="nutrition-row">
            <span class="nutrition-label">Sugars</span>
            <span class="nutrition-value">${sugar}g</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Close popup when close button is clicked
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('close-nutrition-popup')) {
    const popup = e.target.closest('.popup-overlay');
    if (popup) {
      popup.style.display = 'none';
    }
  }
});
