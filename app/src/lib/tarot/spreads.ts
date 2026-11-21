/**
 * Spread definitions — port of `spreads/base.py`.
 *
 * Each spread mirrors one Android spread activity (OneCardActivity,
 * ThreeCardActivity, HorseshoeActivity, CelticCrossActivity and
 * MirrorActivity). A spread declares its positions, their meanings and
 * a layout kind that the web renderer uses to draw the cards.
 */
import { CardReadingType } from "./types";

export interface SpreadPosition {
  index: number; // 0-based deal order
  name: string; // e.g. "The Heart of the Matter"
  description: string; // what this position asks the card
  gridCol?: number | null;
  gridRow?: number | null;
  rotation?: number; // degrees (crossing card = 90)
  arcRise?: number; // px the card is lifted in arc layouts
  mirrorRow?: number | null;
  mirrorSide?: "left" | "right" | "key" | null;
}

export type LayoutKind = "single" | "row" | "arc" | "cross" | "mirror";

export interface Spread {
  key: string; // url-ish key, e.g. "celtic-cross"
  title: string;
  tagline: string;
  readingType: CardReadingType;
  cardCount: number;
  layout: LayoutKind;
  positions: SpreadPosition[];
  description: string;
}

type PositionSpec = [name: string, description: string, hints?: Partial<SpreadPosition>];

function build(
  key: string,
  title: string,
  tagline: string,
  readingType: CardReadingType,
  layout: LayoutKind,
  description: string,
  positionSpecs: PositionSpec[]
): Spread {
  const positions: SpreadPosition[] = positionSpecs.map(([name, description, hints], i) => ({
    index: i,
    name,
    description,
    gridCol: null,
    gridRow: null,
    rotation: 0,
    arcRise: 0,
    mirrorRow: null,
    mirrorSide: null,
    ...hints,
  }));
  return { key, title, tagline, readingType, cardCount: positions.length, layout, positions, description };
}

// ---------------------------------------------------------- one card
const ONE_CARD = build(
  "one-card", "One Card", "A single, focused answer",
  CardReadingType.ONE_CARD, "single",
  "The quickest reading in the app: one card drawn for one question. Ideal for daily " +
    "guidance or a simple yes-or-no nudge in the right direction.",
  [["The Answer", "The single message the cards hold for your question right now."]]
);

// ------------------------------------------------------- three cards
const THREE_CARD = build(
  "three-card", "Three Card", "Past, present and future",
  CardReadingType.THREE_CARD, "row",
  "A classic narrative reading: the root of the matter, where things stand now and " +
    "where the current path leads if nothing changes.",
  [
    ["The Past", "Roots and events that shaped the situation."],
    ["The Present", "The current state of affairs and its dominant energy."],
    ["The Future", "Where the present path is leading."],
  ]
);

// --------------------------------------------------------- horseshoe
const horseshoeOffsets = [64, 26, 6, 0, 6, 26, 64];
const horseshoeRots = [-16, -11, -6, 0, 6, 11, 16];
const HORSESHOE = build(
  "horseshoe", "Horseshoe", "Seven cards fanned in a lucky arc",
  CardReadingType.HORSESHOE, "arc",
  "Seven cards arranged in the shape of a horseshoe. It gives a rounded view of the " +
    "situation — past, present and hidden forces — and ends with practical advice and a " +
    "likely outcome.",
  (
    [
      ["The Past", "Events and influences that brought you here."],
      ["The Present", "Where you stand at this moment."],
      ["Hidden Influences", "Forces working beneath the surface."],
      ["The Querent", "You — your stance and your role in events."],
      ["Attitudes of Others", "How the people around you affect the matter."],
      ["What To Do", "The course of action the cards recommend."],
      ["Likely Outcome", "Where things head if the advice is followed."],
    ] as PositionSpec[]
  ).map(([n, d], i) => [n, d, { arcRise: horseshoeOffsets[i], rotation: horseshoeRots[i] }])
);

// ----------------------------------------------------- celtic cross
const CELTIC_CROSS = build(
  "celtic-cross", "Celtic Cross", "The classic ten-card reading",
  CardReadingType.CELTIC_CROSS, "cross",
  "The most famous tarot spread: a cross of six cards that maps the heart of the matter, " +
    "its challenge and its trajectory, plus a staff of four cards that reveals you, your " +
    "world and the likely outcome.",
  [
    ["The Heart of the Matter", "The core of the situation as it truly is.", { gridCol: 2, gridRow: 2 }],
    ["The Crossing", "What crosses you — the helping or hindering force.", { gridCol: 2, gridRow: 2, rotation: 90.0 }],
    ["The Foundation", "Subconscious roots; the ground you stand on.", { gridCol: 2, gridRow: 3 }],
    ["The Recent Past", "What is just now passing out of influence.", { gridCol: 1, gridRow: 2 }],
    ["The Crown", "Conscious goal, ideal, or what crowns the matter.", { gridCol: 2, gridRow: 1 }],
    ["The Near Future", "What approaches next along the current path.", { gridCol: 3, gridRow: 2 }],
    ["Yourself", "How you see yourself in this matter.", { gridCol: 4, gridRow: 1 }],
    ["The Environment", "People and surroundings shaping events.", { gridCol: 4, gridRow: 2 }],
    ["Hopes and Fears", "What you long for and what you dread.", { gridCol: 4, gridRow: 3 }],
    ["The Outcome", "The culmination if the path holds.", { gridCol: 4, gridRow: 4 }],
  ]
);

// ------------------------------------------------------------- mirror
const MIRROR = build(
  "mirror", "Mirror", "Eleven cards reflected across the glass",
  CardReadingType.MIRROR, "mirror",
  "A spread of self-knowledge laid out across an imaginary mirror. Five paired positions " +
    "reflect inner truth against outer appearance, and a single key card condenses the " +
    "whole reflection into one message.",
  (
    [
      ["How You See Yourself", "Your self-image at the heart of the question.", "left", 1],
      ["How Others See You", "The reflection the world sends back.", "right", 1],
      ["What You Reveal", "The face you choose to show.", "left", 2],
      ["What You Conceal", "What stays behind the glass.", "right", 2],
      ["Your Strength", "What carries you forward.", "left", 3],
      ["Your Challenge", "What tests and tempers you.", "right", 3],
      ["What Uplifts You", "The light you can always draw on.", "left", 4],
      ["What Weighs on You", "The shadow you keep carrying.", "right", 4],
      ["The Path Behind", "What made you who you are.", "left", 5],
      ["The Path Ahead", "Where the reflection is leading.", "right", 5],
      ["The Mirror's Truth", "The synthesis — what the whole reflection says.", "key", 6],
    ] as [string, string, "left" | "right" | "key", number][]
  ).map(([n, d, side, row]) => [n, d, { mirrorRow: row, mirrorSide: side }])
);

export const SPREADS: Record<CardReadingType, Spread> = {
  [CardReadingType.ONE_CARD]: ONE_CARD,
  [CardReadingType.THREE_CARD]: THREE_CARD,
  [CardReadingType.HORSESHOE]: HORSESHOE,
  [CardReadingType.CELTIC_CROSS]: CELTIC_CROSS,
  [CardReadingType.MIRROR]: MIRROR,
};

export function getSpread(readingType: CardReadingType): Spread {
  return SPREADS[readingType];
}
