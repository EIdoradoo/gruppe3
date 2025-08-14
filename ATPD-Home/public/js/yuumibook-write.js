// Tag-Button Logik
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    this.classList.toggle('active');
  });
});

// Hilfsfunktionen für Zutaten
function addIngredient() {
  const container = document.getElementById('recipeBuilderIngredients');
  const count = container.children.length + 1;
  const html = getIngredientHtml(count);
  container.insertAdjacentHTML('beforeend', html);
}

function removeIngredient(id) {
  const element = document.getElementById(`ing${id}`);
  if (element && document.getElementById('recipeBuilderIngredients').children.length > 1) {
    element.remove();
    // Nummerierung aktualisieren
    const containers = document.querySelectorAll('.ingredient-container');
    containers.forEach((container, index) => {
      const newId = index + 1;
      container.id = `ing${newId}`;
      // Alle IDs und Event-Handler in den Inputs aktualisieren
      const inputs = container.querySelectorAll('input, select');
      inputs.forEach(input => {
        const oldId = input.id;
        const newName = oldId.replace(/ing\d+_/, `ing${newId}_`);
        input.id = newName;
        if (input.classList.contains('ingredient_unit')) {
          input.onchange = function() { onUnitChange(newId); };
        }
      });
      // Remove-Button aktualisieren
      const removeBtn = container.querySelector('.remove-btn');
      removeBtn.onclick = function() { removeIngredient(newId); };
    });
  }
}

function writeRecipe() {
  const http = new XMLHttpRequest();
  http.open("POST", "/yuumibook/writerecipe");
  http.setRequestHeader('Content-Type', 'application/json');

  http.onreadystatechange = function () { //Call a function when the state changes.
    if (http.readyState === 4 && http.status === 200) {
      const jsonResponse = JSON.parse(http.responseText);
      if (jsonResponse.message !== 'Success') {
        document.getElementById('write-answer').children[0].innerHTML = jsonResponse.message;
        document.getElementById('write-answer').style.display = "flex";
      } else {
        window.location.href = "/recipe?id="+jsonResponse.id;
      }
    }
  }
  http.send(JSON.stringify(getRecipeJson()));
}

function getRecipeJson() {
  let recipe = {};
  recipe.title = document.getElementById('titleText').value;
  recipe.author = document.getElementById('author').value;
  recipe.servings = document.getElementById('portions').value;
  recipe.description = document.getElementById('description').value;

  const ingredientsContainer = document.querySelectorAll('.ingredient-container');
  let ingredients = [];
  ingredientsContainer.forEach((ingredientHtml, index) => {
    let ingredientObject = {};
    ingredientObject.amount = ingredientHtml.querySelector('.ingredient_amount')?.value || '';
    ingredientObject.unit = ingredientHtml.querySelector('.ingredient_unit')?.value || '';
    ingredientObject.name = ingredientHtml.querySelector('.ingredient_name')?.value || '';
    ingredients.push(ingredientObject);
  });
  recipe.ingredients = ingredients;

  const selected = document.querySelectorAll('.tag-btn.active');
  recipe.tags = Array.from(selected).map(btn => btn.dataset.tag);
  return recipe;
}

function onUnitChange(senderId) {
  const ing_amount = document.getElementById('ing'+senderId+'_amount');
  const ing_unit = document.getElementById('ing'+senderId+'_unit');

  ing_amount.disabled = ing_unit.value === "etwas";
  ing_amount.value = ing_unit.value === "etwas" ? "" : ing_amount.value;
}

function onAmountChange(sender) {
  const input = sender;
  let value = input.value;

  // Punkt durch Komma ersetzen
  value = value.replace(/\./g, ',');

  // Alles außer Ziffern und Komma entfernen
  value = value.replace(/[^0-9,]/g, '');

  // Sicherstellen, dass nur ein Komma enthalten ist
  const parts = value.split(',');
  if (parts.length > 2) {
    // Nur das erste Komma behalten, Rest ignorieren
    value = parts[0] + ',' + parts.slice(1).join('').replace(/,/g, '');
  }

  // Maximal 2 Nachkommastellen
  if (parts.length === 2) {
    value = parts[0] + ',' + parts[1].slice(0, 2);
  }
  input.value = value;
}

function getIngredientHtml(id) {
  return '<div class="ingredient-container" id="ing'+id+'">\n' +
    '          <div class="ingredient-row">\n' +
    '            <div class="form-group">\n' +
    '              <input class="ingredient_amount" type="text" id="ing'+id+'_amount"\n' +
    '                     placeholder="Menge" inputmode="numeric" pattern="[0-9]*"\n' +
    '                     oninput="onAmountChange(this)"/>\n' +
    '              <!--<input class="ingredient_amount" type="text" id="ing1_amount" placeholder="Menge" onchange="onIngredientChange()">-->\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '              <select class="ingredient_unit" id="ing'+id+'_unit" name="unit" onchange="onUnitChange('+id+')">\n' +
    '                <option value="g">g</option>\n' +
    '                <option value="kg">kg</option>\n' +
    '                <option value="ml">ml</option>\n' +
    '                <option value="L">L</option>\n' +
    '                <option value="EL">EL</option>\n' +
    '                <option value="TL">TL</option>\n' +
    '                <option value="etwas">etwas</option>\n' +
    '                <option value="Pck">Pck</option>\n' +
    '              </select>\n' +
    '            </div>\n' +
    '            <div class="form-group name-group">\n' +
    '              <input class="ingredient_name" type="text" id="ing1_name" placeholder="Zutat"">\n' +
    '            </div>\n' +
    '            <button type="button" class="remove-btn" onclick="removeIngredient('+id+')">×</button>\n' +
    '          </div>\n' +
    '        </div>';
}
