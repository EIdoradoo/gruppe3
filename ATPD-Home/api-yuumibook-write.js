const express = require('express');
const router = express.Router();
const pgsql = require('./db');
const logger = require('./api-logger');

const recipeQuery = `INSERT INTO recipes (title, author, servings, instructions, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
const ingredientsQuery = `INSERT INTO ingredients (recipe_id, amount, unit, ingredient) VALUES ($1, $2, $3, $4)`;

router.post('/yuumibook/writerecipe', async (req, res) => {
  try {
    res.json(await insertRecipe(req));
  } catch (err) {
    console.error('Fehler beim Einfügen:', err);
    res.json({message: err});
  }
});

router.delete('/recipe/:id', async (req, res) => {
  try {
    res.json(await deleteRecipe(req));
  } catch (err) {
    console.error('Fehler beim Löschen: ', err);
    res.json({message: err});
  }
});

/**
 * write with given post-body into the database.
 * @returns JSON Object, Error or Success Message.
 */
async function insertRecipe(req) {
  let result = {};
  const recipe = req.body;

  // check if recipe data, or ingredient data has error - if so, don't write to DB, instead, return an error JSON.
  if (!isValidRecipe(recipe)) {
    result.message = "Fehlerhaftes Rezept";
    return result;
  }
  for (const ing of recipe.ingredients) {
    if (!isValidIngredient(ing)) {
      result.message = "Ein oder mehrere fehlerhafte Zutatenattribute";
      return result;
    }
  }
  if (hasValidLength(recipe) !== "") {
    result.message = hasValidLength(recipe);
    return result;
  }

  // tags to lowercase
  recipe.tags = recipe.tags.map(tag => tag.toLowerCase());

  const insertRes =
    await pgsql.query(recipeQuery, [recipe.title, recipe.author, parseInt(recipe.servings), recipe.description, recipe.tags]);
  const recipeId = insertRes.rows[0].id;

  for (const ing of recipe.ingredients) {
    await pgsql.query(ingredientsQuery, [recipeId, ing.amount, ing.unit, ing.name]);
  }

  const metadata = {
    method: req.method,
    path: req.path,
    query: req.query,
    hostname: req.hostname,
    headers: req.headers,
    userAgent: req.get('User-Agent')
  };
  await logger.logToDatabase(`Recipe '${recipe.title}' added to recipebook.`, req.ip, metadata);

  result.message = "Success";
  result.id = recipeId;
  return result;
}

/** checks, if recipe data (author, description...) is valid */
function isValidRecipe(recipe) {
  const allowedTags = ["vegetarisch","vorspeise", "hauptspeise", "nachspeise", "suppe", "salat", "fleischgericht", "backen", "einfach", "glutenfrei", "laktosefrei", "asiatisch"];
  recipe.tags.forEach((tag) => {
    if (!allowedTags.includes(tag)) {
      return false;
    }
  });

  if (recipe.title) {
    if (recipe.title.length >= 50) {
      return false;
    }
  }

  return !(!recipe.title || !recipe.author || !recipe.description || !recipe.tags ||
    !Array.isArray(recipe.tags) || !Number.isInteger(parseInt(recipe.servings)) || parseInt(recipe.servings) <= 0 ||
    recipe.ingredients.length <= 0);
}
/** checks, if recipe lengths (author-length, description-length...) is valid */
function hasValidLength(recipe) {
  if (recipe.title.length >= 50) {
    return "Titel ist zu lang (max: 50)";
  }
  if (recipe.author.length >= 30) {
    return "Author ist zu lang (max: 30)";
  }
  if (recipe.description.length >= 5000) {
    return "Anweisungen sind zu lang (max: 5000)";
  }
  recipe.ingredients.forEach((ingredient) => {
    if (ingredient.amount.startsWith(",") || ingredient.amount.startsWith(".")) {
      return "Zutatenmengen müssen mit einer Zahl anfangen";
    }
    if (ingredient.name.length >= 30) {
      return "Zutatenname(n) zu lang (max: 30)";
    }
  });
  return "";
}
/** checks, if recipe ingredient (unit type, amount value...) is valid */
function isValidIngredient(ing) {
  const allowedUnits = ['g','kg','ml','l','el','tl','etwas','pck'];
  if (ing.amount === "") {
    ing.amount = null;
  }
  //         mengenangabe NICHT LEER UND KEINE ZAHL   mengenangabe KLEINER NULL
  return !( isNaN(ing.amount) || Number(ing.amount) < 0 || !allowedUnits.includes(ing.unit.toLowerCase()) || ing.name === "");
}

/** deletes recipe with 'req.params.id' id from the database
 * @returns JSON Object, Error or Success Message
 */
async function deleteRecipe(req) {
  let id = req.params.id;

  if (typeof id === 'string') {
    id = Number(id);
  }
  if (!id || typeof id !== 'number' || isNaN(id)) {
    return {message: 'None or wrong format ID.'};
  }

  const result = await pgsql.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id]);
  if (result.rowCount === 0) {
    return {message: `No recipe with ID ${id} found.`};
  }

  const metadata = {
    method: req.method,
    path: req.path,
    query: req.query,
    hostname: req.hostname,
    headers: req.headers,
    userAgent: req.get('User-Agent')
  };
  await logger.logToDatabase(`Recipe '${result.rows[0].title}' (ID: '${id}') deleted from recipebook.`, req.ip, metadata);

  return {message: `Success`};
}

module.exports = {router, insertRecipe};
