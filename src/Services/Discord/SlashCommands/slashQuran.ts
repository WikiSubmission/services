import { DiscordBot } from "../../../Modules/DiscordModule";
import { WikiSlashCommand } from "../../../Modules/DiscordModule/Types/WikiSlashCommand";
import { DiscordQuranRequest } from "../../../Modules/DiscordModule/Utilities/DiscordRequest";
import { NetworkUtilities } from "../../../Utilities/NetworkUtilities";
import { HostAddress } from "../../../Vars/Host";
import { Ports } from "../../../Vars/Ports";

export default function command(): WikiSlashCommand {
  return {
    name: "quran",
    description: "Quran | English 🇺🇸",
    options: [
      {
        name: "verse",
        description: "Verse #:# (or #:#-#)",
        type: "STRING",
        localizations: [
          {
            name: "ayet",
            description: "Ayet numarasını girin",
            language: "tr",
          },
        ],
      },
      {
        name: "ignore-commentary",
        description: "Ignore subtitles & footnotes?",
        type: "STRING",
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
        localizations: [
          {
            name: "yorum-yok",
            description: "Altyazı ve dipnot yok mu?",
            language: "tr",
          },
        ],
      },
      {
        name: "with-transliteration",
        description: "Include Arabic transliteration?",
        type: "STRING",
        choices: [
          {
            name: "yes",
            value: "yes",
          },
        ],
        optional: true,
        localizations: [
          {
            name: "transliterasyon",
            description: "transliterasyon içerir?",
            language: "tr",
          },
        ],
      },
    ],
    handler: async (interaction) => {
      // await fetch(`http://${HostAddress}:${Ports.DiscordAPI}/interaction`, {
      //   method: "post",
      //   body: {
      //     // client: DiscordBot.shared.client.toJSON(),
      //     "interaction": JSON.stringify(interaction),
      //     "authorization": `Bot ${(await DiscordBot.shared.getCredentials()).token}`
      //   }
      // });
      return interaction;
    },
  };
}
