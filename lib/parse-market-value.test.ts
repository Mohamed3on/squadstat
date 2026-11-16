import { describe, expect, it } from "vitest";
import { parseMarketValue, tidyValueText } from "./parse-market-value";

describe("tidyValueText", () => {
  it("drops TM's padding zeros and capitalises the unit", () => {
    expect(tidyValueText("€70.00m")).toBe("€70M");
    expect(tidyValueText("€27.50m")).toBe("€27.5M");
    expect(tidyValueText("€1.20bn")).toBe("€1.2B");
    expect(tidyValueText("€800k")).toBe("€800K");
  });

  it("keeps whole numbers whole and leaves non-values alone", () => {
    expect(tidyValueText("€100.00m")).toBe("€100M");
    expect(tidyValueText("€100M")).toBe("€100M");
    expect(tidyValueText("-")).toBe("-");
  });

  it("reads back to the same euros", () => {
    for (const raw of ["€70.00m", "€27.50m", "€1.20bn", "€800k"])
      expect(parseMarketValue(tidyValueText(raw))).toBe(parseMarketValue(raw));
  });
});
