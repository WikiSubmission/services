import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import baseCommand from "./slashQuran";

export default function command(): WikiSlashCommand {
  return {
    ...baseCommand(),
    name: "fquran",
    description: "Quran | French 🇫🇷",
    options: [...(baseCommand().options || [])],
  };
}
