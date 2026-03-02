export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export type Card = { suit: Suit; rank: Rank; id: string };

export function createSpanishDeck40(): Card[] {
  const suits: Suit[] = ["oros", "copas", "espadas", "bastos"];
  const ranks: Rank[] = [1,2,3,4,5,6,7,10,11,12];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, id: `${suit}-${rank}` });
    }
  }
  return deck;
}
