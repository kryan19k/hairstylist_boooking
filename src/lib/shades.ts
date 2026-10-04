// Natural hair colors: each shade = main tone + lighter highlight + deeper lowlight, so the whole
// site becomes a preview of what the salon can create.
// Swatches show the dark-mode values; globals.css re-tunes each for light mode.
export const shades = [
  { id: "honey", name: "Honey Blonde", accent: "#d9a441", accent2: "#f3d08a", counter: "#b8741a" },
  { id: "platinum", name: "Platinum Blonde", accent: "#e6dcc8", accent2: "#faf5ea", counter: "#c9b79a" },
  { id: "strawberry", name: "Strawberry Blonde", accent: "#e08a5a", accent2: "#f5c4a0", counter: "#b85a32" },
  { id: "auburn", name: "Auburn", accent: "#b5482a", accent2: "#e58a62", counter: "#7d2a14" },
  { id: "chestnut", name: "Chestnut Brown", accent: "#a0643c", accent2: "#d49a6a", counter: "#6b3a1e" },
  { id: "jet", name: "Jet Black", accent: "#8b93a7", accent2: "#c9cedb", counter: "#3b4256" },
] as const;
export type ShadeId = (typeof shades)[number]["id"];
