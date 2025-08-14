const express = require('express');
const router = express.Router();
const pgsql = require('./db');

// API Routes
router.post('/recipes', async (req, res) => {
  try {
    res.json(await readRecipes(req));
  } catch (err) {
    console.error('Fehler beim lesen: ', err);
    res.json({message: err});
  }
});

router.get('/recipe', async (req, res) => {
  const query_id = req.query.id;
  let query_servings = req.query.servings;

  // if query has no/NaN ID parameter, redirect to read
  if (!query_id || isNaN(query_id))
    return res.redirect('/yuumibook-read.html');

  // fetch main recipe
  const recipe = await pgsql.query('SELECT * FROM recipes WHERE id = $1', [query_id]);

  // if no recipe with that id was found, redirect to read
  if (recipe.rowCount === 0)
    return res.redirect('/yuumibook-read.html');

  // if query has no/wrong Servings Parameter, redirect to standard servings (4)
  if (!query_servings || isNaN(query_servings))
    return res.redirect('/recipe?id=' + query_id + '&servings=' + recipe.rows[0].servings);

  // fetch ingredient data
  const ingredients = await pgsql.query('SELECT * FROM ingredients WHERE recipe_id = $1', [query_id]);
  recipe.rows[0].ingredients = ingredients.rows;

  // negative zahlen positiv machen
  query_servings = Math.abs(query_servings);
  res.render('recipesite', {
    data: recipe.rows[0],
    multiplicator: (query_servings / recipe.rows[0].servings),
    requestedServings: query_servings
  });
});

/**
 * @param req {import('express').Request} Req Object
 * @returns {Promise<{error: string}|*>} JSON Objects of all saved recipes
 */
async function readRecipes(req) {
  let filterObject = req.body;
  if (!filterObject)
    filterObject = {};

  const conditions = [];
  const filterWords = filterObject.filterText.trim().split(/\s+/).filter(Boolean);
  const searchTags = filterObject.tags || []; // z.B. ['vegan', 'hauptspeise']

  // title/ingredient text search
  if (filterWords.length > 0)
    conditions.push(...filterWords.map(word => `(title ILIKE '%${word}%' OR id IN (SELECT recipe_id FROM ingredients WHERE ingredient ILIKE '%${word}%'))`));

  // tags filter
  if (searchTags.length > 0) {
    const tagList = searchTags.map(tag => `'${tag}'`).join(',');
    conditions.push(`tags @> ARRAY[${tagList}]::text[]`);
  }

  // finished filtering query
  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }
  const filterQuery = `SELECT DISTINCT id, title, servings, tags FROM recipes ${whereClause}`;

  const result = await pgsql.query(filterQuery);

  // counting tags
  const counts = Object.create(null);
  for (const sub of result.rows) {
    for (let tag of sub.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  const fast = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    tags: row.tags,
    servings: row.servings
  }));
  fast.push(counts);

  return fast;
}

/**
 * @type {import('express').Router}
 */
module.exports = router;
