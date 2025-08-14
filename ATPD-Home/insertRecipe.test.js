// insertRecipe.test.js

// Mock der DB richtig definieren
jest.mock('./db', () => ({
  pgsql: {
    query: jest.fn()
  }
}));

const { pgsql } = require('./db'); // Zugriff auf das Mock-Objekt

// Hilfsobjekte
const baseRecipe = {
  name: "Test-Rezept",
  description: "Eine kurze Beschreibung",
  duration: 30,
  servings: 2,
  tags: ["hauptspeise"],
  ingredients: [{ name: "Zutat1", amount: "100g" }]
};

// Funktion, die wir testen
function isValidRecipe(recipe) {
  const allowedTags = ["vegetarisch","vorspeise","hauptspeise","nachspeise","suppe","salat","fleischgericht","backen","einfach","glutenfrei","laktosefrei","asiatisch"];

  if (!recipe) return false;
  if (!recipe.name || recipe.name.length < 2) return false;
  if (!recipe.description || recipe.description.length < 2) return false;
  if (!recipe.duration || recipe.duration <= 0 || recipe.duration > 1440) return false;
  if (!recipe.servings || recipe.servings <= 0) return false;

  if (!Array.isArray(recipe.tags) || recipe.tags.length === 0) return false;
  for (const tag of recipe.tags) {
    if (!allowedTags.includes(tag)) return false;
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return false;
  for (const ingredient of recipe.ingredients) {
    if (!ingredient.name || !ingredient.amount) return false;
  }

  return true;
}

// Mocked insertRecipe
async function insertRecipe(recipe) {
  if (!isValidRecipe(recipe)) throw new Error("Ungültiges Rezept");
  // Simuliere DB Insert
  await pgsql.query("INSERT INTO recipes ...", [recipe.name]);
  return true;
}

// Tests
describe("insertRecipe", () => {
  test("fügt ein korrektes Rezept ein", async () => {
    await expect(insertRecipe(baseRecipe)).resolves.toBe(true);
  });

  test("gibt Fehler zurück, wenn Rezept ungültig ist", async () => {
    const invalidRecipe = { ...baseRecipe, name: "" };
    await expect(insertRecipe(invalidRecipe)).rejects.toThrow("Ungültiges Rezept");
  });

  test("gibt Fehler zurück, wenn Zutat ungültig ist", async () => {
    const invalidRecipe = { ...baseRecipe, ingredients: [{ name: "", amount: "50g" }] };
    await expect(insertRecipe(invalidRecipe)).rejects.toThrow("Ungültiges Rezept");
  });

  test("korrigiert mehrere Tags korrekt", async () => {
    const multiTagRecipe = { ...baseRecipe, tags: ["hauptspeise", "glutenfrei"] };
    await expect(insertRecipe(multiTagRecipe)).resolves.toBe(true);
  });

  test("akzeptiert mehrere Zutaten", async () => {
    const multiIngredientRecipe = { ...baseRecipe, ingredients: [{ name: "Z1", amount: "50g" }, { name: "Z2", amount: "100g" }] };
    await expect(insertRecipe(multiIngredientRecipe)).resolves.toBe(true);
  });

  test("fügt Rezept mit Sonderzeichen im Namen ein", async () => {
    const specialCharRecipe = { ...baseRecipe, name: "Fisch & Chips #1" };
    await expect(insertRecipe(specialCharRecipe)).resolves.toBe(true);
  });
});
