import { z } from "zod";

export const ClientToServer = z.discriminatedUnion("type", [
  z.object({ type: z.literal("table:create") }),
  z.object({ type: z.literal("table:join"), tableId: z.string(), name: z.string(), playerId: z.string() })
]);

export type ClientToServer = z.infer<typeof ClientToServer>;

export type TableState = {
  id: string;
  players: { id: string; name: string }[];
  phase: "lobby" | "dealing" | "bidding" | "playing" | "scoring";
};
