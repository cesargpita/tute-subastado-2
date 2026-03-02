"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyBid,
  applyChooseTrump,
  applyPlayCard,
  cardLabel,
  createGame,
  GameState,
  getBotAction,
  isBotTurn,
  isLegalCardPlay,
  MIN_BID,
  Suit,
} from "@/lib/tute";

const SUITS: Suit[] = ["oros", "copas", "espadas", "bastos"];

function nextBid(currentBid: number | null): number {
  return currentBid === null ? MIN_BID : currentBid + 10;
}

export default function Home() {
  const [game, setGame] = useState<GameState>(() => createGame());

  useEffect(() => {
    if (!isBotTurn(game)) {
      return;
    }

    const timer = setTimeout(() => {
      const action = getBotAction(game);
      if (!action) {
        return;
      }

      setGame((prev) => {
        if (action.type === "bid") {
          return applyBid(prev, action.playerIndex, action.bid);
        }

        if (action.type === "trump") {
          return applyChooseTrump(prev, action.playerIndex, action.trump);
        }

        return applyPlayCard(prev, action.playerIndex, action.cardId);
      });
    }, 650);

    return () => clearTimeout(timer);
  }, [game]);

  const humanHand = game.hands[0];
  const legalCards = useMemo(() => {
    if (game.phase !== "playing" || game.currentTurn !== 0) {
      return new Set<string>();
    }

    return new Set(
      humanHand
        .filter((card) => isLegalCardPlay(humanHand, game.currentTrick, card))
        .map((card) => card.id),
    );
  }, [game, humanHand]);

  const bidderPoints = game.highestBidder !== null ? game.capturedPoints[game.highestBidder] : 0;
  const contract = game.currentBid ?? 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-8">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Tute Subastado</h1>
            <p className="text-sm text-neutral-300">Vertical slice local: 1 jugador + 3 bots</p>
          </div>
          <button
            className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300"
            onClick={() => setGame(createGame(Date.now()))}
            type="button"
          >
            Nueva mano
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
            <h2 className="mb-2 text-lg font-semibold">Estado</h2>
            <p>Fase: {game.phase}</p>
            <p>Turno: {game.players[game.currentTurn]}</p>
            <p>Salida: {game.players[game.leader]}</p>
            <p>Triunfo: {game.trump ?? "-"}</p>
            <p>Contrato: {contract || "-"}</p>
            <p>
              Subastador: {game.highestBidder !== null ? game.players[game.highestBidder] : "-"} ({bidderPoints} pts)
            </p>
          </article>

          <article className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
            <h2 className="mb-2 text-lg font-semibold">Jugadores</h2>
            <ul className="space-y-1 text-sm">
              {game.players.map((name, index) => (
                <li key={name}>
                  {name}: {game.hands[index].length} cartas, {game.capturedPoints[index]} puntos
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
            <h2 className="mb-2 text-lg font-semibold">Baza actual</h2>
            {game.currentTrick.cards.length === 0 ? (
              <p className="text-sm text-neutral-300">Sin cartas en mesa.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {game.currentTrick.cards.map((entry) => (
                  <li key={`${entry.playerIndex}-${entry.card.id}`}>
                    {game.players[entry.playerIndex]}: {cardLabel(entry.card)}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        {game.phase === "bidding" && game.biddingTurn === 0 && (
          <section className="mt-6 rounded-xl border border-emerald-700 bg-emerald-950/50 p-4">
            <h3 className="mb-2 text-lg font-semibold">Tu turno de subasta</h3>
            <div className="flex gap-2">
              <button
                className="rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black hover:bg-emerald-300"
                onClick={() => setGame((prev) => applyBid(prev, 0, nextBid(prev.currentBid)))}
                type="button"
              >
                Pujar {nextBid(game.currentBid)}
              </button>
              <button
                className="rounded-md bg-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-600"
                onClick={() => setGame((prev) => applyBid(prev, 0, null))}
                type="button"
              >
                Pasar
              </button>
            </div>
          </section>
        )}

        {game.phase === "choose-trump" && game.highestBidder === 0 && (
          <section className="mt-6 rounded-xl border border-blue-700 bg-blue-950/40 p-4">
            <h3 className="mb-2 text-lg font-semibold">Elige triunfo</h3>
            <div className="flex flex-wrap gap-2">
              {SUITS.map((suit) => (
                <button
                  key={suit}
                  className="rounded-md bg-blue-400 px-4 py-2 font-semibold text-black hover:bg-blue-300"
                  onClick={() => setGame((prev) => applyChooseTrump(prev, 0, suit))}
                  type="button"
                >
                  {suit}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-neutral-700 bg-neutral-900 p-4">
          <h3 className="mb-2 text-lg font-semibold">Tu mano</h3>
          <div className="flex flex-wrap gap-2">
            {humanHand.map((card) => {
              const isPlayable = legalCards.has(card.id);
              const disabled = game.phase !== "playing" || game.currentTurn !== 0 || !isPlayable;

              return (
                <button
                  key={card.id}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    isPlayable ? "border-amber-300 bg-amber-200/90 text-black" : "border-neutral-600 bg-neutral-800"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                  disabled={disabled}
                  onClick={() => setGame((prev) => applyPlayCard(prev, 0, card.id))}
                  type="button"
                >
                  {cardLabel(card)}
                </button>
              );
            })}
          </div>
          {game.phase === "playing" && game.currentTurn === 0 && (
            <p className="mt-2 text-xs text-neutral-300">Debes seguir el palo de salida cuando tengas cartas de ese palo.</p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-neutral-700 bg-neutral-900 p-4">
          <h3 className="mb-2 text-lg font-semibold">Registro</h3>
          <ul className="space-y-1 text-sm text-neutral-300">
            {game.log.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
