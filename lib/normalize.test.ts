import { describe, it, expect } from "vitest";
import { normalizeForSearch } from "./normalize";

describe("normalizeForSearch", () => {
  it("lowercases plain ASCII", () => {
    expect(normalizeForSearch("Harry Kane")).toBe("harry kane");
  });

  it("trims whitespace", () => {
    expect(normalizeForSearch("  Kane  ")).toBe("kane");
  });

  // Accented Latin (NFD decomposition)
  it("strips common accents via NFD", () => {
    expect(normalizeForSearch("Gyökeres")).toBe("gyokeres");
    expect(normalizeForSearch("Müller")).toBe("muller");
    expect(normalizeForSearch("Álvarez")).toBe("alvarez");
    expect(normalizeForSearch("Mbappé")).toBe("mbappe");
    expect(normalizeForSearch("Griezmann")).toBe("griezmann");
  });

  // Nordic characters
  it("handles Nordic ø → o", () => {
    expect(normalizeForSearch("Ødegaard")).toBe("odegaard");
    expect(normalizeForSearch("Højlund")).toBe("hojlund");
  });

  it("handles Nordic æ → ae", () => {
    expect(normalizeForSearch("Bræthwaite")).toBe("braethwaite");
  });

  // German ß
  it("handles German ß → ss", () => {
    expect(normalizeForSearch("Großkreutz")).toBe("grosskreutz");
  });

  // Turkish characters
  it("handles Turkish ş → s", () => {
    expect(normalizeForSearch("Şahin")).toBe("sahin");
  });

  it("handles Turkish ç → c", () => {
    expect(normalizeForSearch("Çalhanoğlu")).toBe("calhanoglu");
  });

  it("handles Turkish ğ → g", () => {
    expect(normalizeForSearch("Doğan")).toBe("dogan");
  });

  it("handles Turkish dotless ı → i", () => {
    expect(normalizeForSearch("Yıldız")).toBe("yildiz");
    expect(normalizeForSearch("Ardı")).toBe("ardi");
  });

  // Real player name matching scenarios
  describe("player name matching", () => {
    const players = [
      "Viktor Gyökeres",
      "Martin Ødegaard",
      "Hakan Çalhanoğlu",
      "Kenan Yıldız",
      "Rasmus Højlund",
      "Florian Wirtz",
      "Kylian Mbappé",
    ];

    const cases: [string, string][] = [
      ["gyokeres", "Viktor Gyökeres"],
      ["odegaard", "Martin Ødegaard"],
      ["calhanoglu", "Hakan Çalhanoğlu"],
      ["yildiz", "Kenan Yıldız"],
      ["hojlund", "Rasmus Højlund"],
      ["mbappe", "Kylian Mbappé"],
      ["wirtz", "Florian Wirtz"],
    ];

    it.each(cases)("searching '%s' matches '%s'", (query, expected) => {
      const q = normalizeForSearch(query);
      const match = players.find((p) => normalizeForSearch(p).includes(q));
      expect(match).toBe(expected);
    });
  });
});
