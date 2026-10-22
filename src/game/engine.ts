export type Suit = "♦" | "♥" | "♠" | "♣";
export type Rank = "4" | "5" | "6" | "7" | "J" | "Q" | "K" | "A" | "2" | "3";
export type Card = { rank: Rank; suit: Suit; id: string };
export type Team = 0 | 1;
export type TrickPlay = { player: number; team: Team; card: Card };
export type TrickResult = { winner: Team | null; tied: boolean; winningPlay?: TrickPlay };
export type RaiseValue = 2 | 4 | 6 | 8 | 10 | 12;

const ranks: Rank[] = ["4", "5", "6", "7", "J", "Q", "K", "A", "2", "3"];
const suits: Suit[] = ["♦", "♥", "♠", "♣"];

// Higher number wins. The four fixed manilhas outrank all ordinary cards.
const ordinaryPower: Record<Rank, number> = {
  "4": 1, "5": 2, "6": 3, "7": 4, "J": 5, "Q": 6, "K": 7, "A": 8, "2": 9, "3": 10
};
const fixedManilhaPower = new Map<string, number>([
  ["4♣", 14], ["7♥", 13], ["A♠", 12], ["7♦", 11]
]);

export function cardPower(card: Pick<Card, "rank" | "suit">): number {
  return fixedManilhaPower.get(`${card.rank}${card.suit}`) ?? ordinaryPower[card.rank];
}
export function isManilha(card: Pick<Card, "rank" | "suit">): boolean {
  return fixedManilhaPower.has(`${card.rank}${card.suit}`);
}

/** Traditional 40-card deck: A,2,3,4,5,6,7,J,Q,K in each suit.
 * For local variants, pass explicit excluded IDs; no undocumented 37-card rule is assumed. */
export function createDeck(excludedIds: string[] = []): Card[] {
  return ranks.flatMap(rank => suits.map(suit => ({ rank, suit, id: `${rank}${suit}` })))
    .filter(card => !excludedIds.includes(card.id));
}
export function shuffle<T>(input: T[], random: () => number = Math.random): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function deal(deck: Card[], playerCount: number): Card[][] {
  if (![2, 4].includes(playerCount)) throw new Error("O jogo aceita 2 ou 4 jogadores.");
  if (deck.length < playerCount * 3) throw new Error("Baralho insuficiente.");
  const hands = Array.from({ length: playerCount }, () => [] as Card[]);
  for (let card = 0; card < 3; card++) {
    for (let player = 0; player < playerCount; player++) hands[player].push(deck.shift()!);
  }
  return hands;
}
export function resolveTrick(plays: TrickPlay[]): TrickResult {
  if (plays.length < 2) throw new Error("A vaza precisa de pelo menos duas jogadas.");
  const highest = Math.max(...plays.map(p => cardPower(p.card)));
  const top = plays.filter(p => cardPower(p.card) === highest);
  const topTeams = new Set(top.map(p => p.team));
  if (topTeams.size !== 1) return { winner: null, tied: true };
  return { winner: top[0].team, tied: false, winningPlay: top[0] };
}

/** Best-of-three resolver. Policy is explicit because regional tie conventions vary:
 * a tied first trick gives priority to the first team to win a later trick; if no trick is won,
 * the hand is tied and the caller's configurable policy can decide it. */
export function resolveHand(results: TrickResult[]): Team | null {
  const wins: Record<Team, number> = { 0: 0, 1: 0 };
  for (const r of results) {
    if (r.winner !== null) wins[r.winner]++;
    if (wins[0] >= 2) return 0;
    if (wins[1] >= 2) return 1;
  }
  const firstWon = results.find(r => r.winner !== null)?.winner;
  if (firstWon !== undefined) return firstWon;
  return null;
}
export function nextRaise(current: RaiseValue): RaiseValue | null {
  const ladder: RaiseValue[] = [2, 4, 6, 8, 10, 12];
  const i = ladder.indexOf(current);
  return i >= 0 && i < ladder.length - 1 ? ladder[i + 1] : null;
}
export function canCallTruco(scoreA: number, scoreB: number): boolean {
  return scoreA !== 11 && scoreB !== 11;
}
export function applyFoldScore(currentHandValue: RaiseValue, foldingTeam: Team, scores: [number, number]): [number, number] {
  const next: [number, number] = [...scores];
  next[foldingTeam === 0 ? 1 : 0] += currentHandValue;
  return next;
}
export function applyHandScore(winner: Team, value: RaiseValue, scores: [number, number]): [number, number] {
  const next: [number, number] = [...scores];
  next[winner] += value;
  return next;
}
export function handOfTen(scores: [number, number]): boolean { return scores[0] === 10 || scores[1] === 10; }
export function handOfIron(scores: [number, number]): boolean { return scores[0] === 10 && scores[1] === 10; }
export function gameOver(scores: [number, number]): Team | null {
  if (scores[0] >= 12) return 0;
  if (scores[1] >= 12) return 1;
  return null;
}

/** A transparent baseline bot policy; server-side only in multiplayer. */
export function chooseBotCard(hand: Card[], teammateHasPlayed?: boolean): Card {
  if (!hand.length) throw new Error("Bot sem cartas.");
  const sorted = [...hand].sort((a, b) => cardPower(a) - cardPower(b));
  // When a teammate has already played, conserve the strongest card where possible.
  return teammateHasPlayed && sorted.length > 1 ? sorted[0] : sorted[sorted.length - 1];
}
export function shouldBotCallTruco(hand: Card[]): boolean {
  return hand.filter(isManilha).length >= 2 || hand.some(c => cardPower(c) >= 13);
}
export function shouldBotFold(hand: Card[]): boolean {
  return hand.every(c => cardPower(c) <= 5);
}
