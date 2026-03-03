"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  applyBid,
  applyChooseTrump,
  applyPlayCard,
  BID_STEP,
  cardLabel,
  Card,
  createGame,
  GameState,
  getBotAction,
  isBotTurn,
  isLegalCardPlay,
  MAX_BID,
  MIN_BID,
  Suit,
} from "@/lib/tute";

const SUITS: Suit[] = ["oros", "copas", "espadas", "bastos"];

type Seat = {
  playerIndex: number;
  label: string;
  position: "top" | "right" | "left" | "bottom";
};

const SEATS: Seat[] = [
  { playerIndex: 1, label: "Norte", position: "top" },
  { playerIndex: 2, label: "Este", position: "right" },
  { playerIndex: 3, label: "Oeste", position: "left" },
  { playerIndex: 0, label: "Tu", position: "bottom" },
];

function nextBid(currentBid: number | null): number {
  return currentBid === null ? MIN_BID : currentBid + BID_STEP;
}

function cardImageSrc(card: Card): string {
  return `/cards/${card.suit}_${card.rank}.png`;
}

function seatPositionClasses(position: Seat["position"]): string {
  if (position === "top") {
    return "left-1/2 top-4 w-[min(24rem,90%)] -translate-x-1/2";
  }

  if (position === "bottom") {
    return "bottom-4 left-1/2 w-[min(52rem,92%)] -translate-x-1/2";
  }

  if (position === "left") {
    return "left-4 top-1/2 w-36 -translate-y-1/2";
  }

  return "right-4 top-1/2 w-36 -translate-y-1/2";
}

export default function Home() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [now, setNow] = useState<number>(() => Date.now());
  const trickResultToast =
    game.lastTrickResult && now - game.lastTrickResult.id < 2600 ? game.lastTrickResult : null;
  const freezeBetweenTricks = game.phase === "playing" && game.currentTrick.cards.length === 0 && Boolean(trickResultToast);

  useEffect(() => {
    if (!isBotTurn(game) || freezeBetweenTricks) {
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
    }, 900);

    return () => clearTimeout(timer);
  }, [game, freezeBetweenTricks]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);

  const humanHand = game.hands[0];
  const legalCards = useMemo(() => {
    if (game.phase !== "playing" || game.currentTurn !== 0 || game.trump === null) {
      return new Set<string>();
    }

    return new Set(
      humanHand
        .filter((card) => isLegalCardPlay(humanHand, game.currentTrick, card, game.trump!))
        .map((card) => card.id),
    );
  }, [game, humanHand]);

  const bidderPoints = game.highestBidder !== null ? game.capturedPoints[game.highestBidder] : 0;
  const contract = game.currentBid ?? 0;
  const suggestedBid = nextBid(game.currentBid);
  const canRaise = suggestedBid <= MAX_BID;
  const cantoToast = game.lastCanto && now - game.lastCanto.id < 2200 ? game.lastCanto : null;
  const tableCards =
    game.currentTrick.cards.length > 0 ? game.currentTrick.cards : trickResultToast ? trickResultToast.cards : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-3 py-6 md:px-8">
      <section className="rounded-3xl border border-[#5b3b24] bg-[#2f2015] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-amber-100 md:text-3xl">Tute Subastado</h1>
            <p className="text-xs text-amber-200/80 md:text-sm">Mesa local: 1 jugador + 3 bots</p>
          </div>
          <button
            className="rounded-lg border border-amber-200/20 bg-amber-300 px-4 py-2 text-sm font-semibold text-[#1d130b] hover:bg-amber-200"
            onClick={() => setGame(createGame(Date.now()))}
            type="button"
          >
            Nueva mano
          </button>
          <Link
            className="rounded-lg border border-emerald-200/30 bg-emerald-900/60 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
            href="/reglas"
          >
            Ver reglas
          </Link>
        </div>

        <div className="relative min-h-[720px] overflow-hidden rounded-3xl border border-emerald-900/60 bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.2),transparent_35%),radial-gradient(circle_at_75%_70%,rgba(16,185,129,0.15),transparent_45%),linear-gradient(145deg,#0f4a37_0%,#0d5a40_45%,#0b3b2d_100%)] shadow-inner">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_8px)]" />
          {cantoToast && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 animate-pulse rounded-xl border border-amber-100/50 bg-[linear-gradient(160deg,#f59e0b,#b45309)] px-4 py-2 text-center shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-100">Canto</p>
              <p className="text-sm font-extrabold text-white">{game.players[cantoToast.playerIndex]}: +{cantoToast.points}</p>
              <p className="text-xs font-semibold text-amber-100/90">{cantoToast.message}</p>
            </div>
          )}
          {trickResultToast && (
            <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-xl border border-emerald-100/50 bg-[linear-gradient(150deg,#059669,#065f46)] px-4 py-2 text-center shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100">Baza resuelta</p>
              <p className="text-sm font-extrabold text-white">
                {game.players[trickResultToast.winner]} gana la baza
              </p>
              <p className="text-xs font-semibold text-emerald-100/90">+{trickResultToast.points} puntos</p>
            </div>
          )}

          <div className="absolute left-1/2 top-1/2 w-[min(22rem,86vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-200/20 bg-[#0a2f24]/80 p-4 text-center shadow-2xl backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/80">Centro de mesa</p>
            <p className="mt-1 text-sm text-emerald-50">Turno: {game.players[game.currentTurn]}</p>
            <p className="text-sm text-emerald-100/85">
              Triunfo: <span className="font-semibold">{game.trump ?? "-"}</span>
            </p>
            <p className="text-sm text-emerald-100/85">
              Contrato: <span className="font-semibold">{contract || "-"}</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-emerald-50">
              {tableCards.length === 0 ? (
                <p className="col-span-2 rounded-lg border border-emerald-100/15 bg-emerald-950/35 px-2 py-1">Sin cartas en mesa</p>
              ) : (
                tableCards.map((entry) => (
                  <div
                    key={`${entry.playerIndex}-${entry.card.id}`}
                    className="rounded-lg border border-emerald-100/15 bg-emerald-950/35 p-2"
                  >
                    <p className="mb-1 text-[11px]">{game.players[entry.playerIndex]}</p>
                    <div className="mx-auto w-fit overflow-hidden rounded-md border border-black/20 bg-white/90">
                      <Image alt={cardLabel(entry.card)} height={88} src={cardImageSrc(entry.card)} width={58} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {SEATS.map((seat) => {
            const player = game.players[seat.playerIndex];
            const cardsInHand = game.hands[seat.playerIndex].length;
            const points = game.capturedPoints[seat.playerIndex];
            const isTurn = game.currentTurn === seat.playerIndex;
            const isBidder = game.highestBidder === seat.playerIndex;
            const isBottom = seat.position === "bottom";

            return (
              <div
                key={seat.label}
                className={`absolute ${seatPositionClasses(seat.position)} rounded-xl border border-emerald-100/15 bg-black/25 p-3 backdrop-blur-sm`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider text-emerald-50/90">{seat.label}</p>
                  {isTurn && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-black">Turno</span>}
                </div>
                <p className="text-sm font-semibold text-emerald-50">{player}</p>
                <p className="text-xs text-emerald-100/90">{cardsInHand} cartas</p>
                <p className="text-xs text-emerald-100/90">{points} puntos</p>
                {isBidder && <p className="text-xs font-semibold text-amber-200">Subastador ({bidderPoints})</p>}

                {isBottom ? (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {humanHand.map((card) => {
                      const isPlayable = legalCards.has(card.id);
                      const disabled = game.phase !== "playing" || game.currentTurn !== 0 || !isPlayable || freezeBetweenTricks;

                      return (
                        <button
                          key={card.id}
                          className={`overflow-hidden rounded-md border transition ${
                            isPlayable
                              ? "border-amber-200 bg-amber-100 shadow-[0_6px_14px_rgba(0,0,0,0.25)] hover:-translate-y-1"
                              : "border-emerald-100/20 bg-emerald-950/55"
                          } disabled:cursor-not-allowed disabled:opacity-45`}
                          disabled={disabled}
                          onClick={() => setGame((prev) => applyPlayCard(prev, 0, card.id))}
                          type="button"
                        >
                          <Image alt={cardLabel(card)} height={110} src={cardImageSrc(card)} width={72} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`mt-3 flex gap-1 ${seat.position === "top" ? "justify-center" : "flex-wrap"}`}>
                    {Array.from({ length: Math.min(cardsInHand, 10) }).map((_, idx) => (
                      <span
                        key={`${seat.label}-back-${idx}`}
                        className={`block overflow-hidden rounded border border-emerald-100/25 ${
                          seat.position === "top" ? "h-8 w-5" : "h-7 w-4"
                        }`}
                      >
                        <Image
                          alt="Carta boca abajo"
                          className="h-full w-full object-cover"
                          height={seat.position === "top" ? 32 : 28}
                          src="/cards/back.png"
                          width={seat.position === "top" ? 20 : 16}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(game.phase === "bidding" && game.biddingTurn === 0) ||
        (game.phase === "choose-trump" && game.highestBidder === 0) ||
        (game.phase === "playing" && game.currentTurn === 0) ? (
          <section className="mt-4 rounded-xl border border-emerald-200/20 bg-[#153629] p-4 text-emerald-50">
            {game.phase === "bidding" && game.biddingTurn === 0 && (
              <div>
                <h3 className="mb-2 text-base font-semibold">Tu turno de subasta</h3>
                <div className="flex gap-2">
                  {canRaise ? (
                    <button
                      className="rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#102118] hover:bg-emerald-200"
                      onClick={() => setGame((prev) => applyBid(prev, 0, nextBid(prev.currentBid)))}
                      type="button"
                    >
                      Pujar {suggestedBid}
                    </button>
                  ) : (
                    <span className="rounded-md bg-emerald-950/45 px-4 py-2 text-sm text-emerald-100/80">Puja maxima alcanzada ({MAX_BID})</span>
                  )}
                  <button
                    className="rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold hover:bg-emerald-800"
                    onClick={() => setGame((prev) => applyBid(prev, 0, null))}
                    type="button"
                  >
                    Pasar
                  </button>
                </div>
              </div>
            )}

            {game.phase === "choose-trump" && game.highestBidder === 0 && (
              <div>
                <h3 className="mb-2 text-base font-semibold">Elige triunfo</h3>
                <div className="flex flex-wrap gap-2">
                  {SUITS.map((suit) => (
                    <button
                      key={suit}
                      className="rounded-md bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#08231c] hover:bg-cyan-100"
                      onClick={() => setGame((prev) => applyChooseTrump(prev, 0, suit))}
                      type="button"
                    >
                      {suit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {game.phase === "playing" && game.currentTurn === 0 && (
              <p className="text-sm text-emerald-100">
                {freezeBetweenTricks
                  ? "Espera un momento: se esta mostrando el resultado de la baza."
                  : "Juega una carta. Debes seguir el palo de salida si tienes."}
              </p>
            )}
          </section>
        ) : null}

        <section className="mt-4 rounded-xl border border-emerald-200/20 bg-[#10261d] p-4">
          <h3 className="mb-2 text-base font-semibold text-emerald-50">Registro</h3>
          <ul className="space-y-1 text-xs text-emerald-100/90 md:text-sm">
            {game.log.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
