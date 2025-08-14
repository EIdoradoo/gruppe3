// insertRecipe.test.js - Vollständig korrigierte Version

// Mocks müssen vor den Imports stehen
jest.mock('./db', () => ({
  query: jest.fn()
}));

jest.mock('./api-logger', () => ({
  logToDatabase: jest.fn()
}));

const pgsql = require('./db');
const logger = require('./api-logger');
const { insertRecipe } = require('./api-yuumibook-write');

// Korrekte Datenstruktur basierend auf dem tatsächlichen Code
const baseRecipe = Object.freeze({
  title: "Gültiges Test-Rezept",
  author: "Test-Autor",
  description: "Eine leckere und gültige Beschreibung für unser Testrezept.",
  servings: 4,
  tags: ["hauptspeise"],
  ingredients: [
    {
      name: "Test-Zutat",
      amount: "100",
      unit: "g"
    }
  ]
});

// Helper-Funktion für vollständige Request-Objekte
const createMockReq = (body) => ({
  body,
  method: 'POST',
  path: '/yuumibook/writerecipe',
  query: {},
  hostname: 'localhost',
  headers: { 'content-type': 'application/json' },
  get: jest.fn(() => 'jest-test-agent'),
  ip: '127.0.0.1'
});

beforeEach(() => {
  jest.clearAllMocks();
  // Standard Mock-Antwort für erfolgreiche DB-Operationen
  pgsql.query.mockResolvedValue({ rows: [{ id: 123 }], rowCount: 1 });
  logger.logToDatabase.mockResolvedValue();
});

describe("insertRecipe – Vollständige Tests", () => {

  // ===== ERFOLGREICHE TESTS =====

  test("TC-01: Gültiges Rezept → Erfolg", async () => {
    const mockReq = createMockReq({ ...baseRecipe });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
    expect(result.id).toBe(123);
    expect(pgsql.query).toHaveBeenCalledTimes(2); // einmal für recipe, einmal für ingredients
    expect(logger.logToDatabase).toHaveBeenCalled();
  });

  test("TC-02: Mehrere gültige Tags → Erfolg", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      tags: ["hauptspeise", "glutenfrei", "einfach"]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
    // Überprüfe, dass Tags zu lowercase konvertiert wurden
    const recipeCall = pgsql.query.mock.calls[0];
    expect(recipeCall[1][4]).toEqual(["hauptspeise", "glutenfrei", "einfach"]);
  });

  test("TC-03: Tags werden zu lowercase konvertiert", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      tags: ["HAUPTSPEISE", "Glutenfrei"]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
    const recipeCall = pgsql.query.mock.calls[0];
    expect(recipeCall[1][4]).toEqual(["hauptspeise", "glutenfrei"]);
  });

  test("TC-04: Mehrere Zutaten → Erfolg", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [
        { name: "Mehl", amount: "500", unit: "g" },
        { name: "Milch", amount: "250", unit: "ml" },
        { name: "Salz", amount: "1", unit: "tl" }
      ]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
    expect(pgsql.query).toHaveBeenCalledTimes(4); // 1x recipe + 3x ingredients
  });

  test("TC-05: Zutat mit leerem amount wird zu null", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "Salz", amount: "", unit: "etwas" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
    const ingredientCall = pgsql.query.mock.calls[1];
    expect(ingredientCall[1][1]).toBeNull(); // amount sollte null sein
  });

  // ===== VALIDIERUNGSFEHLER - RECIPE =====

  test("TC-06: Fehlender title → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, title: "" });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
    expect(pgsql.query).not.toHaveBeenCalled();
  });

  test("TC-07: Fehlender title (undefined) → Fehlermeldung", async () => {
    const recipeData = { ...baseRecipe };
    delete recipeData.title;
    const mockReq = createMockReq(recipeData);

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-08: Fehlender author → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, author: "" });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-09: Fehlende description → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, description: "" });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-10: servings = 0 → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, servings: 0 });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-11: servings negativ → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, servings: -2 });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-12: servings als String → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, servings: "vier" });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-13: tags null → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, tags: null });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-14: tags leeres Array → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, tags: [] });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-15: tags kein Array → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, tags: "hauptspeise" });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-16: Ungültiger Tag → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, tags: ["pizza"] });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-17: Gemischte Tags (gültig + ungültig) → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, tags: ["hauptspeise", "invalid-tag"] });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  test("TC-18: ingredients leeres Array → Fehlermeldung", async () => {
    const mockReq = createMockReq({ ...baseRecipe, ingredients: [] });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

  // ===== LÄNGENBESCHRÄNKUNGEN =====

  test("TC-19: Title zu lang (≥50 Zeichen) → Fehlermeldung", async () => {
    const longTitle = "x".repeat(50);
    const mockReq = createMockReq({ ...baseRecipe, title: longTitle });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Titel ist zu lang (max: 50)");
  });

  test("TC-20: Title genau 49 Zeichen → Erfolg", async () => {
    const titleWith49Chars = "x".repeat(49);
    const mockReq = createMockReq({ ...baseRecipe, title: titleWith49Chars });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
  });

  test("TC-21: Author zu lang (≥30 Zeichen) → Fehlermeldung", async () => {
    const longAuthor = "x".repeat(30);
    const mockReq = createMockReq({ ...baseRecipe, author: longAuthor });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Author ist zu lang (max: 30)");
  });

  test("TC-22: Description zu lang (≥5000 Zeichen) → Fehlermeldung", async () => {
    const longDesc = "x".repeat(5000);
    const mockReq = createMockReq({ ...baseRecipe, description: longDesc });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Anweisungen sind zu lang (max: 5000)");
  });

  // ===== INGREDIENT-VALIDIERUNG =====

  test("TC-23: Ingredient ohne name → Fehlermeldung", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "", amount: "100", unit: "g" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Ein oder mehrere fehlerhafte Zutatenattribute");
  });

  test("TC-24: Ingredient mit ungültiger unit → Fehlermeldung", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "Test", amount: "100", unit: "xyz" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Ein oder mehrere fehlerhafte Zutatenattribute");
  });

  test("TC-25: Ingredient amount negativ → Fehlermeldung", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "Test", amount: "-100", unit: "g" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Ein oder mehrere fehlerhafte Zutatenattribute");
  });

  test("TC-26: Ingredient amount nicht numerisch → Fehlermeldung", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "Test", amount: "abc", unit: "g" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Ein oder mehrere fehlerhafte Zutatenattribute");
  });

  test("TC-27: Ingredient amount beginnt mit Komma → Fehlermeldung", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "Test", amount: ",100", unit: "g" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Zutatenmengen müssen mit einer Zahl anfangen");
  });

  test("TC-28: Ingredient amount beginnt mit Punkt → Fehlermeldung", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: "Test", amount: ".100", unit: "g" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Zutatenmengen müssen mit einer Zahl anfangen");
  });

  test("TC-29: Ingredient name zu lang (≥30 Zeichen) → Fehlermeldung", async () => {
    const longName = "x".repeat(30);
    const mockReq = createMockReq({
      ...baseRecipe,
      ingredients: [{ name: longName, amount: "100", unit: "g" }]
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Zutatenname(n) zu lang (max: 30)");
  });

  // ===== GÜLTIGE UNITS TESTEN =====

  test("TC-30: Alle gültigen Units → Erfolg", async () => {
    const validUnits = ['g', 'kg', 'ml', 'l', 'el', 'tl', 'etwas', 'pck'];

    for (const unit of validUnits) {
      const mockReq = createMockReq({
        ...baseRecipe,
        ingredients: [{ name: "Test", amount: "100", unit }]
      });

      const result = await insertRecipe(mockReq);
      expect(result.message).toBe("Success");

      jest.clearAllMocks();
      pgsql.query.mockResolvedValue({ rows: [{ id: 123 }], rowCount: 1 });
    }
  });

  // ===== EDGE CASES =====

  test("TC-31: Null Request → Fehler", async () => {
    await expect(insertRecipe(null)).rejects.toThrow();
  });

  test("TC-32: Request ohne body → Fehler", async () => {
    const mockReq = { method: 'POST' };
    await expect(insertRecipe(mockReq)).rejects.toThrow();
  });

  test("TC-33: DB-Fehler beim Recipe Insert → Exception", async () => {
    pgsql.query.mockRejectedValueOnce(new Error("Database connection failed"));
    const mockReq = createMockReq({ ...baseRecipe });

    await expect(insertRecipe(mockReq)).rejects.toThrow("Database connection failed");
  });

  test("TC-34: DB-Fehler beim Ingredient Insert → Exception", async () => {
    pgsql.query
      .mockResolvedValueOnce({ rows: [{ id: 123 }], rowCount: 1 }) // Recipe erfolgreich
      .mockRejectedValueOnce(new Error("Ingredient insert failed")); // Ingredient fehlgeschlagen

    const mockReq = createMockReq({ ...baseRecipe });

    await expect(insertRecipe(mockReq)).rejects.toThrow("Ingredient insert failed");
  });

  // ===== GRENZWERTE TESTEN =====

  test("TC-35: Servings = 1 → Erfolg", async () => {
    const mockReq = createMockReq({ ...baseRecipe, servings: 1 });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
  });

  test("TC-36: Sehr hohe servings → Erfolg", async () => {
    const mockReq = createMockReq({ ...baseRecipe, servings: 999999 });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
  });

  test("TC-37: Sonderzeichen in Strings → Erfolg", async () => {
    const mockReq = createMockReq({
      ...baseRecipe,
      title: "Käse & Würstchen #1",
      author: "Müller-Schmidt",
      description: "Mit Öl, Äpfeln und 100% Bio-Zutaten!"
    });

    const result = await insertRecipe(mockReq);

    expect(result.message).toBe("Success");
  });

  test("TC-38: Tags Case-Insensitive Check → Funktioniert nur mit lowercase", async () => {
    const mockReq = createMockReq({ ...baseRecipe, tags: ["Vegetarisch"] });

    const result = await insertRecipe(mockReq);

    // Großgeschriebene Tags sind nicht in der allowedTags Liste
    expect(result.message).toBe("Fehlerhaftes Rezept");
  });

});
