import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import baseCommand from "./slashQuran";

export default function command(): WikiSlashCommand {
  return {
    ...baseCommand(),
    name: "squran",
    description: "Quran | Swedish 🇸🇪",
    options: [...(baseCommand().options || [])],
  };
}
