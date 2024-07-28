import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import baseCommand from "./slashQuran";

export default function command(): WikiSlashCommand {
  return {
    ...baseCommand(),
    name: "aquran",
    description: "Quran | Arabic 🇪🇬",
    options: [...(baseCommand().options || [])],
  };
}
