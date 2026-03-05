export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
};

export type Bid = number | null;

export type TrickCard = {
  playerIndex: number;
  card: Card;
};

export type Trick = {
  leader: number;
  cards: TrickCard[];
};

export type GamePhase = "bidding" | "choose-trump" | "playing" | "finished";
export type BotDifficulty = "facil" | "normal" | "dificil";

export type CantoEvent = {
  id: number;
  playerIndex: number;
  suit: Suit;
  points: 20 | 40;
  message: string;
};

export type TrickResultEvent = {
  id: number;
  winner: number;
  points: number;
  cards: TrickCard[];
};

export type GameState = {
  seed: number;
  botDifficulty: BotDifficulty;
  phase: GamePhase;
  players: string[];
  hands: Card[][];
  bids: Bid[];
  currentBid: number | null;
  highestBidder: number | null;
  passCount: number;
  biddingTurn: number;
  trump: Suit | null;
  currentTurn: number;
  leader: number;
  currentTrick: Trick;
  completedTricks: Trick[];
  capturedPoints: number[];
  sungCantos: Suit[][];
  lastCanto: CantoEvent | null;
  lastTrickResult: TrickResultEvent | null;
  log: string[];
};

const SUITS: Suit[] = ["oros", "copas", "espadas", "bastos"];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const RANK_ORDER: Rank[] = [2, 4, 5, 6, 7, 10, 11, 12, 3, 1];

export const MIN_BID = 60;
export const BID_STEP = 5;
export const MAX_BID = 130;

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
    }
  }

  return deck;
}

function mulberry32(seed: number): () => number {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = result[i];
    result[i] = result[j]!;
    result[j] = tmp!;
  }

  return result;
}

function deal(deck: Card[]): Card[][] {
  const hands: Card[][] = [[], [], [], []];

  for (let i = 0; i < deck.length; i += 1) {
    hands[i % 4].push(deck[i]!);
  }

  for (const hand of hands) {
    hand.sort(compareCardsForHand);
  }

  return hands;
}

function cardRankValue(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

function compareCardsForHand(a: Card, b: Card): number {
  if (a.suit !== b.suit) {
    return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
  }

  return cardRankValue(b.rank) - cardRankValue(a.rank);
}

export function rankPoints(rank: Rank): number {
  switch (rank) {
    case 1:
      return 11;
    case 3:
      return 10;
    case 12:
      return 4;
    case 11:
      return 3;
    case 10:
      return 2;
    default:
      return 0;
  }
}

function cardStrength(card: Card): number {
  return cardRankValue(card.rank);
}

function beatsInSameSuit(candidate: Card, target: Card): boolean {
  return candidate.suit === target.suit && cardStrength(candidate) > cardStrength(target);
}

function highestCardOfSuit(cards: TrickCard[], suit: Suit): Card | null {
  const sameSuit = cards.filter((entry) => entry.card.suit === suit).map((entry) => entry.card);
  if (sameSuit.length === 0) {
    return null;
  }

  return [...sameSuit].sort((a, b) => cardStrength(b) - cardStrength(a))[0]!;
}

export function trickWinner(cards: TrickCard[], trump: Suit): number {
  const leadSuit = cards[0]!.card.suit;
  const trumpCards = cards.filter((c) => c.card.suit === trump);
  const eligible = trumpCards.length > 0 ? trumpCards : cards.filter((c) => c.card.suit === leadSuit);

  let best = eligible[0]!;

  for (const candidate of eligible.slice(1)) {
    if (cardStrength(candidate.card) > cardStrength(best.card)) {
      best = candidate;
    }
  }

  return best.playerIndex;
}

export function legalCardsForPlay(hand: Card[], trick: Trick, trump: Suit): Card[] {
  if (trick.cards.length === 0) {
    return [...hand];
  }

  const leadSuit = trick.cards[0]!.card.suit;
  const leadSuitCards = hand.filter((item) => item.suit === leadSuit);
  const trumpCards = hand.filter((item) => item.suit === trump);
  const highestLeadOnTable = highestCardOfSuit(trick.cards, leadSuit);
  const highestTrumpOnTable = highestCardOfSuit(trick.cards, trump);

  // 1) Asistir: if possible, play lead suit.
  if (leadSuitCards.length > 0) {
    // 2) Montar: if possible, play a higher lead-suit card.
    if (highestLeadOnTable) {
      const mountingCards = leadSuitCards.filter((candidate) => beatsInSameSuit(candidate, highestLeadOnTable));
      if (mountingCards.length > 0) {
        return mountingCards;
      }
    }

    return leadSuitCards;
  }

  // 3) Fallar/Pisar: no lead suit, must trump; if already trumped, must overtrump when possible.
  if (highestTrumpOnTable) {
    const overtrumps = trumpCards.filter((candidate) => beatsInSameSuit(candidate, highestTrumpOnTable));
    if (overtrumps.length > 0) {
      return overtrumps;
    }

    // 4) Contrafallar: if cannot overtrump, any card is legal.
    return [...hand];
  }

  if (trumpCards.length > 0) {
    return trumpCards;
  }

  // No lead suit and no trumps available: any card.
  return [...hand];
}

export function isLegalCardPlay(hand: Card[], trick: Trick, card: Card, trump: Suit): boolean {
  if (trick.cards.length === 0) {
    return hand.some((item) => item.id === card.id);
  }

  return legalCardsForPlay(hand, trick, trump).some((item) => item.id === card.id);
}

function handStrengthForBid(hand: Card[]): number {
  const points = hand.reduce((sum, card) => sum + rankPoints(card.rank), 0);
  const trumpPotential = SUITS.map((suit) => hand.filter((c) => c.suit === suit).length).sort((a, b) => b - a)[0] ?? 0;
  return points + trumpPotential * 2;
}

function bidFromStrength(strength: number): number | null {

  if (strength >= 60) {
    return 130;
  }

  if (strength >= 56) {
    return 125;
  }

  if (strength >= 52) {
    return 120;
  }

  if (strength >= 48) {
    return 115;
  }

  if (strength >= 44) {
    return 110;
  }

  if (strength >= 40) {
    return 105;
  }

  if (strength >= 36) {
    return 100;
  }

  if (strength >= 33) {
    return 95;
  }

  if (strength >= 30) {
    return 90;
  }

  if (strength >= 27) {
    return 85;
  }

  if (strength >= 24) {
    return 80;
  }

  if (strength >= 21) {
    return 75;
  }

  if (strength >= 18) {
    return 70;
  }

  if (strength >= 16) {
    return 65;
  }

  if (strength >= 14) {
    return 60;
  }

  return null;
}

export function estimateBotBid(hand: Card[], difficulty: BotDifficulty = "normal"): number | null {
  const baseStrength = handStrengthForBid(hand);
  const adjustedStrength = baseStrength + (difficulty === "facil" ? -5 : difficulty === "dificil" ? 5 : 0);
  return bidFromStrength(adjustedStrength);
}

export function chooseBotTrump(hand: Card[], difficulty: BotDifficulty = "normal"): Suit {
  if (difficulty === "facil") {
    const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return randomSuit!;
  }

  const bySuit = SUITS.map((suit) => {
    const cards = hand.filter((c) => c.suit === suit);
    const points = cards.reduce((sum, c) => sum + rankPoints(c.rank), 0);
    const highCards = cards.filter((c) => c.rank === 1 || c.rank === 3).length;
    return {
      suit,
      value: cards.length * 3 + points + (difficulty === "dificil" ? highCards * 3 : 0),
    };
  }).sort((a, b) => b.value - a.value);

  return bySuit[0]!.suit;
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function chooseBotCard(hand: Card[], trick: Trick, trump: Suit, difficulty: BotDifficulty = "normal"): Card {
  const legal = legalCardsForPlay(hand, trick, trump);

  if (difficulty === "facil" && Math.random() < 0.55) {
    return randomFrom(legal);
  }

  if (trick.cards.length === 0) {
    if (difficulty === "dificil") {
      return [...legal].sort((a, b) => cardStrength(b) - cardStrength(a))[0]!;
    }

    return [...legal].sort((a, b) => cardStrength(a) - cardStrength(b))[0]!;
  }

  const winningPlayer = trickWinner(trick.cards, trump);
  const currentlyWinningCard = trick.cards.find((entry) => entry.playerIndex === winningPlayer)!.card;
  const leadSuit = trick.cards[0]!.card.suit;

  const winningCards = legal.filter((card) => {
    const simulated = [...trick.cards, { playerIndex: 99, card }];
    return trickWinner(simulated, trump) === 99;
  });

  if (winningCards.length > 0) {
    return [...winningCards].sort((a, b) => cardStrength(a) - cardStrength(b))[0]!;
  }

  const sameSuit = legal.filter((card) => card.suit === leadSuit);
  if (sameSuit.length > 0) {
    return [...sameSuit].sort((a, b) => cardStrength(a) - cardStrength(b))[0]!;
  }

  const nonTrump = legal.filter((card) => card.suit !== trump);
  if (nonTrump.length > 0) {
    return [...nonTrump].sort((a, b) => cardStrength(a) - cardStrength(b))[0]!;
  }

  if (currentlyWinningCard.suit === trump) {
    return [...legal].sort((a, b) => cardStrength(a) - cardStrength(b))[0]!;
  }

  return [...legal].sort((a, b) => cardStrength(a) - cardStrength(b))[0]!;
}

export function createGame(seed = Date.now(), options?: { botDifficulty?: BotDifficulty }): GameState {
  const players = ["Tu", "Paco", "Carmen", "Lola"];
  const deck = shuffle(createDeck(), seed);
  const hands = deal(deck);
  const leader = seed % 4;
  const botDifficulty = options?.botDifficulty ?? "normal";

  return {
    seed,
    botDifficulty,
    phase: "bidding",
    players,
    hands,
    bids: [null, null, null, null],
    currentBid: null,
    highestBidder: null,
    passCount: 0,
    biddingTurn: leader,
    trump: null,
    currentTurn: leader,
    leader,
    currentTrick: { leader, cards: [] },
    completedTricks: [],
    capturedPoints: [0, 0, 0, 0],
    sungCantos: [[], [], [], []],
    lastCanto: null,
    lastTrickResult: null,
    log: [`Nueva mano. Sale ${players[leader]}.`],
  };
}

function withLog(state: GameState, message: string): GameState {
  return {
    ...state,
    log: [message, ...state.log].slice(0, 12),
  };
}

function nextIndex(index: number): number {
  return (index + 1) % 4;
}

function removeCard(hand: Card[], cardId: string): Card[] {
  return hand.filter((card) => card.id !== cardId);
}

function automaticCantoForPlay(
  playerIndex: number,
  card: Card,
  remainingHand: Card[],
  trump: Suit,
  alreadySung: Suit[],
): CantoEvent | null {
  if (card.rank !== 11 && card.rank !== 12) {
    return null;
  }

  if (alreadySung.includes(card.suit)) {
    return null;
  }

  const counterpartRank: Rank = card.rank === 11 ? 12 : 11;
  const hasCounterpart = remainingHand.some((item) => item.suit === card.suit && item.rank === counterpartRank);

  if (!hasCounterpart) {
    return null;
  }

  const points: 20 | 40 = card.suit === trump ? 40 : 20;

  return {
    id: Date.now(),
    playerIndex,
    suit: card.suit,
    points,
    message: `Canto de ${points} en ${card.suit}`,
  };
}

export function applyBid(state: GameState, playerIndex: number, bid: number | null): GameState {
  if (state.phase !== "bidding" || state.biddingTurn !== playerIndex) {
    return state;
  }

  const player = state.players[playerIndex]!;
  const previousBid = state.currentBid;
  const legalRaise = previousBid === null ? MIN_BID : previousBid + BID_STEP;

  if (bid !== null && (bid < legalRaise || bid > MAX_BID || bid % BID_STEP !== 0)) {
    return withLog(state, `${player} intento pujar ${bid} y no es valido.`);
  }

  let nextState: GameState = {
    ...state,
    bids: [...state.bids],
    biddingTurn: nextIndex(playerIndex),
  };

  if (bid === null) {
    nextState.passCount += 1;
    nextState.bids[playerIndex] = nextState.bids[playerIndex] ?? null;
    nextState = withLog(nextState, `${player} pasa.`);
  } else {
    nextState.currentBid = bid;
    nextState.highestBidder = playerIndex;
    nextState.passCount = 1;
    nextState.bids[playerIndex] = bid;
    nextState = withLog(nextState, `${player} puja ${bid}.`);
  }

  const hasAnyBid = nextState.currentBid !== null;

  if (!hasAnyBid && nextState.passCount >= 4) {
    return withLog(createGame(state.seed + 1, { botDifficulty: state.botDifficulty }), "Todos pasaron. Se reparten nuevas cartas.");
  }

  if (hasAnyBid && nextState.passCount >= 4) {
    nextState.phase = "choose-trump";
    const bidder = nextState.highestBidder!;
    nextState.currentTurn = bidder;
    nextState.leader = bidder;
    nextState.currentTrick = { leader: bidder, cards: [] };
    nextState = withLog(nextState, `${nextState.players[bidder]} gana la subasta con ${nextState.currentBid}.`);
  }

  return nextState;
}

export function applyChooseTrump(state: GameState, playerIndex: number, trump: Suit): GameState {
  if (state.phase !== "choose-trump" || state.highestBidder !== playerIndex) {
    return state;
  }

  const nextState: GameState = {
    ...state,
    phase: "playing",
    trump,
    currentTurn: state.leader,
    currentTrick: { leader: state.leader, cards: [] },
  };

  return withLog(nextState, `${state.players[playerIndex]} canta triunfo: ${trump}.`);
}

export function applyPlayCard(state: GameState, playerIndex: number, cardId: string): GameState {
  if (state.phase !== "playing" || state.trump === null || state.currentTurn !== playerIndex) {
    return state;
  }

  const hand = state.hands[playerIndex]!;
  const card = hand.find((item) => item.id === cardId);

  if (!card || !isLegalCardPlay(hand, state.currentTrick, card, state.trump)) {
    return withLog(state, `${state.players[playerIndex]} intento una jugada ilegal.`);
  }

  const nextHands = state.hands.map((h, index) => (index === playerIndex ? removeCard(h, cardId) : h));
  const remainingHand = nextHands[playerIndex]!;
  const canto = automaticCantoForPlay(playerIndex, card, remainingHand, state.trump, state.sungCantos[playerIndex]!);
  const nextTrick: Trick = {
    leader: state.currentTrick.leader,
    cards: [...state.currentTrick.cards, { playerIndex, card }],
  };

  const nextPoints = [...state.capturedPoints];
  const nextSungCantos = state.sungCantos.map((suits) => [...suits]);
  if (canto) {
    nextPoints[playerIndex] += canto.points;
    nextSungCantos[playerIndex]!.push(canto.suit);
  }

  let nextState: GameState = {
    ...state,
    hands: nextHands,
    currentTrick: nextTrick,
    currentTurn: nextIndex(playerIndex),
    capturedPoints: nextPoints,
    sungCantos: nextSungCantos,
    lastCanto: canto,
  };

  nextState = withLog(nextState, `${state.players[playerIndex]} juega ${card.rank} de ${card.suit}.`);
  if (canto) {
    nextState = withLog(nextState, `${state.players[playerIndex]} canta ${canto.points} en ${canto.suit}.`);
  }

  if (nextTrick.cards.length < 4) {
    return nextState;
  }

  const winner = trickWinner(nextTrick.cards, state.trump);
  const points = nextTrick.cards.reduce((sum, entry) => sum + rankPoints(entry.card.rank), 0);
  const isLastTrick = nextState.hands.every((cardsInHand) => cardsInHand.length === 0);
  const awardedPoints = points + (isLastTrick ? 10 : 0);

  const trickPoints = [...nextState.capturedPoints];
  trickPoints[winner] += awardedPoints;

  nextState = {
    ...nextState,
    capturedPoints: trickPoints,
    completedTricks: [...nextState.completedTricks, nextTrick],
    lastTrickResult: {
      id: Date.now(),
      winner,
      points: awardedPoints,
      cards: nextTrick.cards,
    },
    leader: winner,
    currentTurn: winner,
    currentTrick: { leader: winner, cards: [] },
  };

  nextState = withLog(nextState, `${state.players[winner]} gana la baza (${points}${isLastTrick ? " +10 ultima" : ""}).`);

  if (isLastTrick) {
    const contract = nextState.currentBid ?? 0;
    const bidder = nextState.highestBidder!;
    const bidderPoints = trickPoints[bidder];
    const success = bidderPoints >= contract;

    nextState = {
      ...nextState,
      phase: "finished",
    };

    nextState = withLog(
      nextState,
      `${nextState.players[bidder]} ${success ? "cumple" : "no cumple"} contrato ${contract} con ${bidderPoints} puntos.`,
    );
  }

  return nextState;
}

export function isBotTurn(state: GameState): boolean {
  if (state.phase === "finished") {
    return false;
  }

  if (state.phase === "choose-trump") {
    return (state.highestBidder ?? 0) !== 0;
  }

  return state.currentTurn !== 0;
}

export function getBotAction(state: GameState):
  | { type: "bid"; playerIndex: number; bid: number | null }
  | { type: "trump"; playerIndex: number; trump: Suit }
  | { type: "play"; playerIndex: number; cardId: string }
  | null {
  if (!isBotTurn(state)) {
    return null;
  }

  if (state.phase === "bidding") {
    const playerIndex = state.biddingTurn;
    const hand = state.hands[playerIndex]!;
    const estimate = estimateBotBid(hand, state.botDifficulty);

    if (estimate === null) {
      return { type: "bid", playerIndex, bid: null };
    }

    const minRaise = state.currentBid === null ? MIN_BID : state.currentBid + BID_STEP;
    if (estimate < minRaise) {
      return { type: "bid", playerIndex, bid: null };
    }

    const capped = Math.min(MAX_BID, estimate);
    return { type: "bid", playerIndex, bid: capped };
  }

  if (state.phase === "choose-trump") {
    const playerIndex = state.highestBidder!;
    const hand = state.hands[playerIndex]!;
    return { type: "trump", playerIndex, trump: chooseBotTrump(hand, state.botDifficulty) };
  }

  if (state.phase === "playing") {
    const playerIndex = state.currentTurn;
    const hand = state.hands[playerIndex]!;
    const card = chooseBotCard(hand, state.currentTrick, state.trump!, state.botDifficulty);
    return { type: "play", playerIndex, cardId: card.id };
  }

  return null;
}

export function cardLabel(card: Card): string {
  return `${card.rank} de ${card.suit}`;
}
