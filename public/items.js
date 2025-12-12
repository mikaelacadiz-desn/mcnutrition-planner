import { setCategoryFilter, clearCategoryFilter, showAllCategories } from './filter.js';

// McDonald's menu listings for each category
const createListings = (menuItems) => {

  // Group items by category
  const categories = {};
  menuItems.forEach(item => {
    const category = item.CATEGORY;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });

  // Create filter buttons
  createFilterButtons(categories);

  // Store categories and items for filtering
  window.menuCategories = categories;
  window.allMenuItems = menuItems;
  
  // Display all categories by default when page loads
  const resultsContainer = document.getElementById('results-container');
  Object.entries(categories)
    .filter(([categoryName, items]) => items.length > 0)
    .forEach(([categoryName, items]) => {
      displayCategoryItems(categoryName, items, resultsContainer);
    });
};

// Create search bar and category dropdown
function createFilterButtons(categories) {
  const main = document.querySelector('.main-content');
  
  // Create filter container
  const filterContainer = document.createElement('div');
  filterContainer.classList.add('filter-container');

  // Create controls wrapper for search and dropdown
  const controlsWrapper = document.createElement('div');
  controlsWrapper.classList.add('controls-wrapper');
  
  // Create search bar
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.id = 'searchInput';
  searchInput.placeholder = 'Search menu items...';
  searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  
  // Create category dropdown
  const categorySelect = document.createElement('select');
  categorySelect.id = 'categoryFilter';
  categorySelect.classList.add('category-dropdown');
  
  // Add "All Categories" option
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Categories';
  allOption.selected = true;
  categorySelect.appendChild(allOption);
  
  // Add category options
  Object.keys(categories).forEach(categoryKey => {
    if (categories[categoryKey].length > 0) {
      const option = document.createElement('option');
      option.value = categoryKey;
      option.textContent = formatCategoryName(categoryKey);
      categorySelect.appendChild(option);
    }
  });
  
  categorySelect.addEventListener('change', (e) => {
    if (e.target.value === '') {
      showAllCategoriesLocal();
    } else {
      filterByCategory(e.target.value);
    }
  });
  
  // Create filter icon button
  const filterButton = document.createElement('button');
  filterButton.id = 'filterButton';
  filterButton.classList.add('filter-icon-btn');
  filterButton.innerHTML = '<img src="./assets/filter.svg" alt="Filter" />';
  
  // Show popup on hover
  filterButton.addEventListener('mouseenter', () => {
    const popup = document.getElementById('nutritionalFilterPopup');
    if (popup) {
      popup.classList.add('show');
    }
  });
  
  // Hide popup when mouse leaves button (unless entering popup)
  filterButton.addEventListener('mouseleave', (e) => {
    const popup = document.getElementById('nutritionalFilterPopup');
    if (popup) {
      // Small delay to allow mouse to move to popup
      setTimeout(() => {
        const isHoveringPopup = popup.matches(':hover');
        const isHoveringButton = filterButton.matches(':hover');
        if (!isHoveringPopup && !isHoveringButton) {
          popup.classList.remove('show');
        }
      }, 50);
    }
  });
  
  controlsWrapper.appendChild(searchInput);
  controlsWrapper.appendChild(categorySelect);
  controlsWrapper.appendChild(filterButton);
  filterContainer.appendChild(controlsWrapper);
  main.appendChild(filterContainer);
  
  // Create container for filtered results
  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('results-container');
  resultsContainer.id = 'results-container';
  main.appendChild(resultsContainer);
  
  // Store search input reference globally
  window.searchInput = searchInput;
  window.categorySelect = categorySelect;
}

// Handle search input
function handleSearch(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  
  // If search is empty, show category filtered or all items
  if (term === '') {
    const selectedCategory = window.categorySelect?.value;
    if (selectedCategory) {
      filterByCategory(selectedCategory);
    } else {
      showAllCategoriesLocal();
    }
    return;
  }
  
  // Get all menu items
  const allItems = window.allMenuItems;
  const selectedCategory = window.categorySelect?.value;
  
  // Filter by search term
  let filteredItems = allItems.filter(item => {
    return item.ITEM?.toLowerCase().includes(term);
  });
  
  // Also filter by category if one is selected
  if (selectedCategory) {
    filteredItems = filteredItems.filter(item => item.CATEGORY === selectedCategory);
  }
  
  // Display results
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '';
  
  if (filteredItems.length > 0) {
    // Group by category
    const categories = {};
    filteredItems.forEach(item => {
      const category = item.CATEGORY;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    
    // Display each category
    Object.entries(categories).forEach(([categoryName, items]) => {
      displayCategoryItems(categoryName, items, resultsContainer);
    });
  } else {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h3>No Results Found</h3>
        <p>No items match your search "${searchTerm}"</p>
      </div>
    `;
  }
}

// Filter items by category
function filterByCategory(categoryKey) {
  // Clear search input
  if (window.searchInput) {
    window.searchInput.value = '';
  }
  
  // Use the integrated filter system
  setCategoryFilter(categoryKey);
}

// Show all categories
function showAllCategoriesLocal() {
  // Clear search input
  if (window.searchInput) {
    window.searchInput.value = '';
  }
  
  // Reset category dropdown
  if (window.categorySelect) {
    window.categorySelect.value = '';
  }
  
  // Use the integrated filter system
  showAllCategories();
}

// Display items for a specific category
function displayCategoryItems(categoryName, items, container, activeFilter = null) {
  // Create section for this category
  const section = document.createElement('section');
  section.classList.add(categoryName.toLowerCase());
  
  // Add a category header
  const categoryHeader = document.createElement('h3');
  categoryHeader.textContent = formatCategoryName(categoryName);
  section.appendChild(categoryHeader);
  
  // Add item count
  const itemCount = document.createElement('p');
  itemCount.classList.add('item-count');
  itemCount.textContent = `Found ${items.length} items`;
  section.appendChild(itemCount);
  
  // Iterate over the list of items for this category
  items.forEach((item, index) => {
    // Create a unique ID for each item
    const itemId = `${categoryName}-${index}`;
    
    // Get a placeholder image URL (you can replace this with actual McDonald's images if available)
    const iconURL = getItemImageURL(item.ITEM);
    
    // assign a unique ID to the popover
    const popoverId = `${categoryName}-${index}`;
    
    // make a div / template for each listing. 
    const div = document.createElement('div');
    div.classList.add('listing');
    
    // Add nutritional highlights based on the active filter
    const nutritionalHighlight = getNutritionalHighlight(item, activeFilter);
    
    // the template includes a button to open the popover
    // as well as a placeholder for the popover itself.
    
    // Extract item name and weight (grams/ounces) using pattern matching
    const itemText = item.ITEM;
    let cleanedName = itemText;
    let grams = '';
    let ounces = '';
    
    // Match various gram formats:
    // 1. "5.0 oz (250 g)" - oz with grams in parentheses
    let gramsMatch = itemText.match(/\s*([\d.]+)\s*oz\s*\((\d+)\s*g\)\s*$/);
    if (gramsMatch) {
      ounces = gramsMatch[1];
      grams = gramsMatch[2];
      cleanedName = itemText.replace(/\s*[\d.]+\s*oz\s*\(\d+\s*g\)\s*$/, '');
    } else {
      // 2. "(5g)" - grams in parentheses at the end
      gramsMatch = itemText.match(/\s*\((\d+)\s*g\)\s*$/);
      if (gramsMatch) {
        grams = gramsMatch[1];
        cleanedName = itemText.replace(/\s*\(\d+\s*g\)\s*$/, '');
      } else {
        // 3. "5g" - standalone grams at the end
        gramsMatch = itemText.match(/\s+(\d+)\s*g\s*$/);
        if (gramsMatch) {
          grams = gramsMatch[1];
          cleanedName = itemText.replace(/\s+\d+\s*g\s*$/, '');
        }
      }
      
      // 4. "(5oz)" - ounces in parentheses at the end
      if (!grams) {
        const ouncesMatch = itemText.match(/\s*\(([\d.]+)\s*oz\)\s*$/);
        if (ouncesMatch) {
          ounces = ouncesMatch[1];
          cleanedName = itemText.replace(/\s*\([\d.]+\s*oz\)\s*$/, '');
        } else {
          // 5. "5oz" - standalone ounces at the end
          const ouncesMatch2 = itemText.match(/\s+([\d.]+)\s*oz\s*$/);
          if (ouncesMatch2) {
            ounces = ouncesMatch2[1];
            cleanedName = itemText.replace(/\s+[\d.]+\s*oz\s*$/, '');
          }
        }
      }
    }
    
    const itemName = cleanedName;
    
    let template = `
      <div class="item-wrapper">
        <span class="info-icon-btn" data-popup-id="${popoverId}">
          <img src="assets/info.svg" alt="Info" />
        </span>
        <button class="open" data-popup-id="${popoverId}">
          <span class="item-name">${itemName}</span>
          ${grams ? `<span class="item-grams">${grams}g</span>` : ''}
          ${ounces && !grams ? `<span class="item-ounces">${ounces}oz</span>` : ''}
          ${nutritionalHighlight}
        </button>
      </div>
      <div class="popup-overlay" id="${popoverId}" style="display: none;">
        <div class="popup-content">
          Loading nutritional information...
        </div>
      </div>`;
    
    div.innerHTML = DOMPurify.sanitize(template);
    
    // Store the item data for the popup
    window.menuItemsData = window.menuItemsData || {};
    window.menuItemsData[popoverId] = item;
    
    // Check if item is already selected
    if (window.isItemSelected && window.isItemSelected(popoverId)) {
      const button = div.querySelector('.open');
      if (button) button.classList.add('selected');
    }
    
    // Add click event listener to the info icon
    const infoIcon = div.querySelector('.info-icon-btn');
    if (infoIcon) {
      infoIcon.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Info icon clicked, opening nutrition popup:', popoverId);
        
        if (window.openNutritionPopup) {
          await window.openNutritionPopup(popoverId);
        } else {
          console.error('openNutritionPopup function not available');
        }
      });
    }
    
    // Add click event listener to the button
    const button = div.querySelector('.open');
    if (button) {
      // Click to add to planner
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Toggle selection
        if (window.addToPlanner) {
          const isSelected = window.addToPlanner(item, popoverId);
          
          if (isSelected) {
            button.classList.add('selected');
          } else {
            button.classList.remove('selected');
          }
        }
      });
    }
    
    // add this listing to the section for this category
    section.appendChild(div);
  });
  
  // add this section to the main part of the page
  container.appendChild(section);
}

// Helper function to format category names for display
function formatCategoryName(categoryName) {
  const categoryMap = {
    'BURGERSANDWICH': 'Burgers & Sandwiches',
    'CHICKENFISH': 'Chicken & Fish',
    'BREAKFAST': 'Breakfast',
    'SALAD': 'Salads',
    'SNACKSIDE': 'Snacks & Sides',
    'BEVERAGE': 'Beverages',
    'MCCAFE': 'McCafé',
    'DESSERTSHAKE': 'Desserts & Shakes',
    'CONDIMENT': 'Condiments',
    'ALLDAYBREAKFAST': 'All Day Breakfast'
  };
  
  return categoryMap[categoryName] || categoryName.replace(/([A-Z])/g, ' $1').trim();
}

// Helper function to get item image URL (placeholder for now)
function getItemImageURL(itemName) {
  // For now, return a placeholder. In a real implementation, you might:
  // 1. Have a mapping of item names to image URLs
  // 2. Use a service that generates food images
  // 3. Use McDonald's official images if available
  return 'https://via.placeholder.com/100x100?text=🍔';
}

// Get nutritional highlight for an item based on active filter
function getNutritionalHighlight(item, activeFilter = null) {
  if (!activeFilter) return '';
  
  const protein = parseInt(item.PRO) || 0;
  const fiber = parseInt(item.FBR) || 0;
  const carbs = parseInt(item.CARB) || 0;
  const sugar = parseInt(item.SGR) || 0;
  const calories = parseInt(item.CAL) || 0;
  
  // Only show the highlight that matches the active filter
  switch(activeFilter) {
    case 'high-protein':
      if (protein >= 20) return `<span class="nutritional-highlight">${protein}g protein</span>`;
      break;
    case 'gut-friendly':
      if (fiber >= 5) return `<span class="nutritional-highlight">${fiber}g fiber</span>`;
      break;
    case 'low-carb':
      if (carbs <= 20) return `<span class="nutritional-highlight">${carbs}g carbs</span>`;
      break;
    case 'low-sugar':
      if (sugar <= 10) return `<span class="nutritional-highlight">${sugar}g sugar</span>`;
      break;
    case 'calorie-conscious':
      if (calories <= 400) return `<span class="nutritional-highlight">${calories} cal</span>`;
      break;
    default:
      return '';
  }
  
  return '';
}

export { createListings, displayCategoryItems, formatCategoryName, getItemImageURL };