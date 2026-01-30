const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');
const recipeSearch = document.getElementById('recipe-search');
const difficultyFilter = document.getElementById('difficulty-filter');
const timeFilter = document.getElementById('time-filter');
const recipeGrid = document.getElementById('recipe-grid');
const recipeCount = document.getElementById('recipe-count');
const ingredientInput = document.getElementById('ingredient-input');
const addIngredientButton = document.getElementById('add-ingredient');
const ingredientList = document.getElementById('ingredient-list');
const ingredientTotal = document.getElementById('ingredient-total');
const favoriteCount = document.getElementById('favorite-count');
const saveCount = document.getElementById('save-count');
const filterCount = document.getElementById('filter-count');

const ingredientPrices = {
  paneer: 120,
  spinach: 45,
  quinoa: 160,
  'bell peppers': 80,
  'greek yogurt': 75,
  mushrooms: 90,
};

let favorites = 12;
let saves = 28;

const updateFooterStats = (filters = 2) => {
  favoriteCount.textContent = favorites.toString();
  saveCount.textContent = saves.toString();
  filterCount.textContent = filters.toString();
};

const setActiveTab = (tabId) => {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive.toString());
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setActiveTab(tab.dataset.tab);
  });
});

const filterRecipes = () => {
  if (!recipeGrid) {
    return;
  }

  const query = recipeSearch?.value.toLowerCase() ?? '';
  const difficulty = difficultyFilter?.value ?? '';
  const time = timeFilter?.value ?? '';
  let visibleCount = 0;
  let activeFilters = 0;

  if (query) activeFilters += 1;
  if (difficulty) activeFilters += 1;
  if (time) activeFilters += 1;

  recipeGrid.querySelectorAll('.recipe-card').forEach((card) => {
    const title = card.dataset.title ?? '';
    const matchesQuery = title.includes(query);
    const matchesDifficulty = difficulty ? card.dataset.difficulty === difficulty : true;
    const matchesTime = time ? card.dataset.time === time : true;
    const isVisible = matchesQuery && matchesDifficulty && matchesTime;

    card.style.display = isVisible ? 'flex' : 'none';
    if (isVisible) visibleCount += 1;
  });

  recipeCount.textContent = `${visibleCount} recipes available`;
  updateFooterStats(activeFilters || 2);
};

recipeSearch?.addEventListener('input', filterRecipes);
difficultyFilter?.addEventListener('change', filterRecipes);
timeFilter?.addEventListener('change', filterRecipes);

const updateIngredientTotal = () => {
  let total = 0;
  ingredientList.querySelectorAll('li').forEach((item) => {
    const priceText = item.querySelector('.price')?.textContent ?? '₹0';
    const value = Number(priceText.replace(/[^0-9]/g, ''));
    total += value;
  });
  ingredientTotal.textContent = `₹${total}`;
};

const addIngredient = () => {
  const value = ingredientInput.value.trim();
  if (!value) return;

  const priceKey = value.toLowerCase();
  const price = ingredientPrices[priceKey] ?? 60;
  const item = document.createElement('li');
  item.innerHTML = `
    <span class="item-name">${value}</span>
    <span class="price">₹${price}</span>
    <button class="remove-btn" type="button" aria-label="Remove ${value}">×</button>
  `;
  ingredientList.appendChild(item);
  ingredientInput.value = '';
  updateIngredientTotal();
};

addIngredientButton?.addEventListener('click', addIngredient);

ingredientInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addIngredient();
  }
});

ingredientList?.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.classList.contains('remove-btn')) {
    target.closest('li')?.remove();
    updateIngredientTotal();
  }
});

const toggleAction = (button) => {
  const action = button.dataset.action;
  const isActive = button.classList.toggle('active');

  if (action === 'favorite') {
    favorites += isActive ? 1 : -1;
  }
  if (action === 'save') {
    saves += isActive ? 1 : -1;
  }

  updateFooterStats();
};

document.querySelectorAll('.icon-btn').forEach((button) => {
  button.addEventListener('click', () => toggleAction(button));
});

updateIngredientTotal();
updateFooterStats();
filterRecipes();
