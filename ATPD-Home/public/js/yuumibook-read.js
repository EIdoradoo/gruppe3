/**
 * fetches filtered recipes from the database and calls updateRecipeCards (to output them)
 */
function getRecipes() {
  let filterOptions = {};
  filterOptions.filterText = document.getElementById('filterText').value.toLowerCase();
  const selected = document.querySelectorAll('.tag-btn.active');
  filterOptions.tags = Array.from(selected).map(btn => btn.dataset.tag);

  const http = new XMLHttpRequest();
  http.open("POST", "/recipes");
  http.setRequestHeader('Content-Type', 'application/json');

  http.onreadystatechange = function () {
    if (http.readyState === 4 && http.status === 200) {
      updateRecipeCards(JSON.parse(http.response));
    }
  }
  http.send(JSON.stringify(filterOptions));
}

/**
 * renders the received recipes
 */
function updateRecipeCards(jsonRes) {
  const recipeList = document.getElementById('recipe-list');

  const existingMessage = recipeList.querySelector('.no-results');
  if (existingMessage) {
    recipeList.removeChild(existingMessage);
  }
  recipeList.innerHTML = ''; // reset all

  if (!jsonRes || !Array.isArray(jsonRes) || jsonRes.every(recipe => !recipe?.id)) {
    const noResults = document.createElement('p');
    noResults.className = 'no-results';
    noResults.innerHTML = `
    <h3>Leider wurde nichts Passendes gefunden.</h3>
    <p>Versuchen Sie es mit einem anderen Suchbegriff<br>oder überprüfen Sie die Schreibweise.</p>
  `;
    recipeList.appendChild(noResults);
    updateTagButtons({});
    return;
  }

  jsonRes.forEach(recipe => {
    if (!Object.hasOwn(recipe, 'id')) {
      return;
    }
    const recipeCard = document.createElement('div');
    recipeCard.classList.add('recipe-card');
    recipeCard.dataset.tags = recipe.tags;
    recipeCard.addEventListener('click', function () {
      window.location.href = "/recipe?id="+recipe.id+"&servings="+document.getElementById('servingsText').value;
    })
    recipeCard.style.cursor = 'pointer';


    // title
    const title = document.createElement('h2');
    title.textContent = recipe.title;

    // bring recipe-parts together
    recipeCard.appendChild(title);

    recipeList.appendChild(recipeCard);
  });
  updateTagButtons(jsonRes[jsonRes.length - 1]);
}

/**
 * updates the tag-buttons with new "amount" values (how many recipes with that tag is left)
 * @param jsonRes
 */
function updateTagButtons(jsonRes) {
  const tagButtons
    = Array.from(document.querySelector('.tags-container').children);
  tagButtons.forEach(button => {
    let buttonTag = button.dataset.tag;
    button.style.display = 'none';

    for (const tag in jsonRes) {
      if (buttonTag === tag) {
        button.innerHTML = capitalizeFirstLetter(buttonTag) + " (" + jsonRes[tag] + ")";
        button.style.display = 'block';
      }
    }
  });
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

/**
 * adds event listeners to the tag buttons
 */
function setupTagButtons() {
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.classList.toggle('active');
      getRecipes();
    });
  });
}
