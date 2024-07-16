import { ClientEvents } from "discord.js";

export interface WikiListener {
  event: keyof ClientEvents;
  action: () => Promise<void>;
}
