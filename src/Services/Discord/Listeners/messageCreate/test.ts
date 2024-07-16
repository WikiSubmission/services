import { DiscordBot } from "../../../../Modules/DiscordModule";

export default function listener() {
  DiscordBot.shared.addEventListener("messageCreate", async (message) => {
    if (message.author.bot) return;
    console.log(message.content);
    await message.reply("Hello!");
  });
}
