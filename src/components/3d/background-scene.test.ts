import { describe, expect, it } from "vitest";
import { createParticles, FIELD } from "./background-scene";

describe("createParticles", () => {
  it("creates the requested number of particles", () => {
    expect(createParticles(40)).toHaveLength(40);
  });

  it("keeps every particle within the field bounds", () => {
    for (const p of createParticles(120)) {
      expect(p.x).toBeGreaterThanOrEqual(-FIELD.width / 2);
      expect(p.x).toBeLessThanOrEqual(FIELD.width / 2);
      expect(p.y).toBeGreaterThanOrEqual(-FIELD.height / 2);
      expect(p.y).toBeLessThanOrEqual(FIELD.height / 2);
      expect(p.z).toBeGreaterThanOrEqual(-FIELD.depth / 2);
      expect(p.z).toBeLessThanOrEqual(FIELD.depth / 2);
    }
  });

  it("is deterministic for a given random source", () => {
    const random = () => 0.5;
    expect(createParticles(5, random)).toEqual(createParticles(5, random));
  });
});