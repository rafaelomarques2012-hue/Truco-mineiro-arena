import { describe, it, expect } from "vitest";
import { cardPower, createDeck, isManilha, canCallTruco, gameOver, handOfIron, nextRaise, resolveTrick, type Card } from "../src/game/engine";
describe("Truco Mineiro rules",()=>{
  it("has 40 cards in the default deck",()=>expect(createDeck()).toHaveLength(40));
  it("orders fixed manilhas exactly",()=>{
    expect(cardPower({rank:"4",suit:"♣"})).toBeGreaterThan(cardPower({rank:"7",suit:"♥"}));
    expect(cardPower({rank:"7",suit:"♥"})).toBeGreaterThan(cardPower({rank:"A",suit:"♠"}));
    expect(cardPower({rank:"A",suit:"♠"})).toBeGreaterThan(cardPower({rank:"7",suit:"♦"}));
    expect(isManilha({rank:"4",suit:"♣"})).toBe(true);
    expect(isManilha({rank:"4",suit:"♦"})).toBe(false);
  });
  it("orders ordinary ranks 3 > 2 > A > K > Q > J > 7 > 6 > 5 > 4",()=>{
    const order:Card[]=["3","2","A","K","Q","J","7","6","5","4"].map(rank=>({rank:rank as Card["rank"],suit:"♥",id:rank+"♥"}));
    for(let i=0;i<order.length-1;i++) expect(cardPower(order[i])).toBeGreaterThan(cardPower(order[i+1]));
  });
  it("does not allow truco when either side is at 11",()=>{
    expect(canCallTruco(9,8)).toBe(true); expect(canCallTruco(11,4)).toBe(false); expect(canCallTruco(11,11)).toBe(false);
  });
  it("advances raise ladder",()=>{expect(nextRaise(2)).toBe(4);expect(nextRaise(4)).toBe(6);expect(nextRaise(10)).toBe(12);expect(nextRaise(12)).toBe(null)});
  it("detects iron hand and end at 12",()=>{expect(handOfIron([10,10])).toBe(true);expect(gameOver([12,8])).toBe(0);expect(gameOver([8,12])).toBe(1);expect(gameOver([11,11])).toBe(null)});
  it("resolves a trick by card power",()=>{
    const r=resolveTrick([{player:0,team:0,card:{rank:"3",suit:"♣",id:"3♣"}},{player:1,team:1,card:{rank:"4",suit:"♣",id:"4♣"}}]);
    expect(r.winner).toBe(1);
  });
});
