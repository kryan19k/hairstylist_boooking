// Placeholder content — services, portfolio, reviews, FAQs.
// When the DB is connected, services/looks/reviews move to Supabase tables
// (see supabase/schema.sql) and this file becomes the seed.

export type ServiceCategory = "Cut" | "Color" | "Blonding" | "Styling";

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  blurb: string;
  price: number;
  minutes: number;
  deposit: number;
};

export type Addon = { id: string; name: string; blurb: string; price: number; minutes: number };

export const services: Service[] = [
  { id: "cut-signature", name: "Signature Cut & Finish", category: "Cut", blurb: "Consultation, shampoo, a cut shaped to your bone structure and your morning routine, styled to leave.", price: 95, minutes: 60, deposit: 25 },
  { id: "cut-bob", name: "Bob & Crop Architecture", category: "Cut", blurb: "Blunt, soft, micro or lived-in. Geometry that moves when you do.", price: 110, minutes: 75, deposit: 25 },
  { id: "cut-fringe", name: "Fringe Refresh", category: "Cut", blurb: "Curtain, wispy or blunt. A quick reshape between cuts.", price: 30, minutes: 15, deposit: 0 },
  { id: "color-root", name: "Root & Gloss", category: "Color", blurb: "Seamless root coverage with a glossing finish for mirror-level shine.", price: 135, minutes: 120, deposit: 40 },
  { id: "color-allover", name: "Dimensional Color", category: "Color", blurb: "Custom-mixed all-over shade with hand-painted depth, never flat.", price: 190, minutes: 150, deposit: 50 },
  { id: "color-vivid", name: "Vivid & Fashion Color", category: "Color", blurb: "Copper, orchid, emerald, cherry. Saturated color that lasts.", price: 240, minutes: 210, deposit: 75 },
  { id: "blonde-highlights", name: "Foil Highlights", category: "Blonding", blurb: "Fine, strategic foils for brightness with a believable grow-out.", price: 230, minutes: 180, deposit: 60 },
  { id: "blonde-balayage", name: "Hand-Painted Balayage", category: "Blonding", blurb: "Sun-kissed, lived-in lightness painted freehand around your face.", price: 310, minutes: 210, deposit: 75 },
  { id: "blonde-platinum", name: "Platinum Transformation", category: "Blonding", blurb: "Dark to icy in a carefully staged, bond-protected session.", price: 420, minutes: 300, deposit: 100 },
  { id: "style-blowout", name: "Signature Blowout", category: "Styling", blurb: "Volume, bounce or glass-smooth. Built to last for days.", price: 65, minutes: 45, deposit: 0 },
  { id: "style-updo", name: "Event Updo", category: "Styling", blurb: "Braids, twists, sleek buns and soft romantic shapes.", price: 150, minutes: 75, deposit: 40 },
  { id: "style-bridal", name: "Bridal Trial", category: "Styling", blurb: "Your wedding look, rehearsed. Inspiration, tweaks and a plan for the day.", price: 195, minutes: 90, deposit: 50 },
];

export const addons: Addon[] = [
  { id: "add-gloss", name: "Shine Gloss", blurb: "Tone + glass-like shine", price: 40, minutes: 20 },
  { id: "add-bond", name: "Bond Repair", blurb: "Rebuilds strength mid-service", price: 45, minutes: 20 },
  { id: "add-scalp", name: "Scalp Ritual", blurb: "Massage, exfoliation, mask", price: 35, minutes: 20 },
  { id: "add-blowout", name: "Add a Blowout", blurb: "Finish it with a style", price: 50, minutes: 30 },
];

export const categories: ServiceCategory[] = ["Cut", "Color", "Blonding", "Styling"];

/* ---------- Portfolio ---------- */

export type LookKind = "straight" | "wave" | "curl" | "bob";
export type LookCategory = "Color" | "Cut" | "Texture" | "Bridal";

export type Look = {
  id: string;
  title: string;
  category: LookCategory;
  kind: LookKind;
  palette: [string, string, string];
  serviceId: string;
  story: string;
  hours: string;
  seed: number;
  // Drop real photos in /public/looks and set these — art falls back to generative strands.
  image?: string;
  before?: string;
};

export const looks: Look[] = [
  { id: "honey-veil", title: "Honey Veil", category: "Color", kind: "straight", palette: ["#6a3b1e", "#d99a52", "#f6dca8"], serviceId: "blonde-balayage", story: "Level 4 espresso lifted to warm honey, hand-painted so the light falls like a veil.", hours: "3.5 hrs", seed: 11 },
  { id: "copper-silk", title: "Copper Silk", category: "Color", kind: "wave", palette: ["#5b1f12", "#d8602d", "#f2a56b"], serviceId: "color-vivid", story: "A high-shine copper with a deeper root for dimension that never looks flat.", hours: "3.5 hrs", seed: 23 },
  { id: "midnight-orchid", title: "Midnight Orchid", category: "Color", kind: "straight", palette: ["#1d1030", "#6b3fa8", "#c7a0f0"], serviceId: "color-vivid", story: "Blue-black melting into orchid at the ends. Fashion color with restraint.", hours: "4 hrs", seed: 37 },
  { id: "platinum-halo", title: "Platinum Halo", category: "Color", kind: "bob", palette: ["#5c6270", "#cfd6e2", "#fbfbff"], serviceId: "blonde-platinum", story: "Black to ice in two staged sessions with bond repair at every step.", hours: "5 hrs", seed: 41 },
  { id: "soft-curtain-bob", title: "Soft Curtain Bob", category: "Cut", kind: "bob", palette: ["#2a1a14", "#7a4a35", "#c18a68"], serviceId: "cut-bob", story: "Collarbone bob with face-framing curtain fringe. Air-dry friendly.", hours: "1.25 hrs", seed: 53 },
  { id: "rose-quartz-waves", title: "Rose Quartz Waves", category: "Texture", kind: "wave", palette: ["#6e3a45", "#e59aa4", "#fbd5cf"], serviceId: "style-blowout", story: "Soft rose gloss with loose heat-set waves that last through the weekend.", hours: "1 hr", seed: 67 },
  { id: "crown-braid", title: "Crown Braid", category: "Bridal", kind: "curl", palette: ["#3a2418", "#b98a5e", "#f1dcc0"], serviceId: "style-bridal", story: "A romantic crown braid with pulled-loose tendrils and fresh-flower prep.", hours: "1.5 hrs", seed: 79 },
  { id: "espresso-gloss", title: "Espresso Gloss", category: "Color", kind: "straight", palette: ["#1a0f0b", "#4a2a1c", "#8d5a3f"], serviceId: "color-root", story: "Deep chocolate gloss with a mirror finish. Rich, never black.", hours: "2 hrs", seed: 83 },
  { id: "bouncy-curl", title: "Bouncy Curl Sculpt", category: "Texture", kind: "curl", palette: ["#2b1710", "#9a5b34", "#e0a56e"], serviceId: "cut-signature", story: "Dry-cut curl shaping that lets every spiral sit exactly where it should.", hours: "1.5 hrs", seed: 97 },
  { id: "sunlit-lob", title: "Sunlit Lob", category: "Cut", kind: "straight", palette: ["#4d3526", "#c79a6e", "#f4dfb8"], serviceId: "blonde-highlights", story: "Shoulder-grazing lob with fine foils, brightness that grows out softly.", hours: "3 hrs", seed: 101 },
  { id: "wedding-chignon", title: "Wedding Chignon", category: "Bridal", kind: "bob", palette: ["#2f2018", "#a37a56", "#ecd9c0"], serviceId: "style-updo", story: "Low, sculpted chignon with a satin finish. Photographs beautifully.", hours: "1.25 hrs", seed: 113 },
  { id: "emerald-edge", title: "Emerald Edge", category: "Color", kind: "wave", palette: ["#0c2a22", "#1f8f6c", "#8fe3c0"], serviceId: "color-vivid", story: "Deep forest green with a bright underlayer that flashes when you move.", hours: "4 hrs", seed: 127 },
];

export const lookCategories: ("All" | LookCategory)[] = ["All", "Color", "Cut", "Texture", "Bridal"];

/* ---------- Reviews (placeholder) ---------- */

export const reviews = [
  { name: "Maya R.", service: "Hand-Painted Balayage", quote: "I walked in nervous about going lighter and walked out feeling like the best version of myself. Three months later it still looks expensive.", stars: 5 },
  { name: "Josephine T.", service: "Bridal Trial", quote: "She listened to every Pinterest board I sent and somehow made it better. My wedding hair held up through the dancing and the rain.", stars: 5 },
  { name: "Dani K.", service: "Signature Cut", quote: "Best haircut of my life. It falls perfectly even when I do nothing to it. That is the whole point.", stars: 5 },
  { name: "Priya S.", service: "Vivid Color", quote: "Orchid that stays orchid. Every other stylist faded me out in two weeks; this has lasted two months.", stars: 5 },
  { name: "Lena W.", service: "Platinum Transformation", quote: "Black to platinum and my hair is still healthy. I did not think that was possible.", stars: 5 },
  { name: "Camille B.", service: "Bob & Crop", quote: "The consultation alone was worth it. She explained why each choice suited me, not just what was trendy.", stars: 5 },
];

export const faqs = [
  { q: "How much is the deposit, and is it refundable?", a: "Deposits range from $0–$100 depending on the service and are applied to your final total. They are fully refundable or transferable with 48 hours' notice." },
  { q: "What if I need to reschedule?", a: "Life happens. You can move your appointment free of charge up to 48 hours before. Within 48 hours the deposit is held toward your next visit." },
  { q: "Do I need a consultation for a big color change?", a: "For corrections and dramatic changes, we recommend a free 15-minute consult first. Book 'Fringe Refresh' or message us and we'll slot you in." },
  { q: "How long will my service take?", a: "The booking tool adds up your services and shows the exact finish time before you confirm." },
  { q: "Can I bring inspiration photos?", a: "Please do. Send them with your booking notes or bring them on the day. We'll talk through what's realistic for your hair history." },
  { q: "Do you color all hair types?", a: "Yes. Straight, wavy, curly and coily, with bond-protective techniques tailored to each." },
];

export const aftercare = [
  { title: "Wait 48 hours", body: "Skip washing for two days after color so the pigment can fully settle." },
  { title: "Go cool and gentle", body: "Cool water, sulfate-free shampoo, and a weekly bond-repair mask extend color life." },
  { title: "Protect from heat", body: "Always use heat protectant and keep tools below 175°C / 350°F." },
  { title: "Book your refresh", body: "Gloss at 6 weeks, cut at 8–10, color maintenance at 10–12. We'll remind you." },
];
