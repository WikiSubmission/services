import { DiscordBot } from "../../../../Modules/DiscordModule";
import { DiscordMemberManager } from "../../../../Modules/DiscordModule/Utilities/DiscordMemberManager";
import { DiscordUtilities } from "../../../../Modules/DiscordModule/Utilities/DiscordUtilities";

export default function listener(): void {
  DiscordBot.shared.addEventListener(
    "voiceStateUpdate",
    async (oldState, newState) => {
      const resolvedMember = await DiscordMemberManager.get(
        newState.member,
        newState.guild.id,
      );

      if (
        !resolvedMember ||
        !resolvedMember.member ||
        !resolvedMember.moderatedGuild
      )
        return;

      // Loop over each channel, only one will meet our condition to send the alert.
      for (const voiceChannel of resolvedMember.moderatedGuild
        .keyVoiceChannels) {
        // Alert join, if was not in a channel.
        if (
          oldState.channelId === null &&
          newState.channelId === voiceChannel.voice &&
          newState.channel &&
          newState.member
        ) {
          const channel = await DiscordUtilities.getChannelById(
            voiceChannel.text,
            newState.guild.id,
          );
          await channel?.send({
            content: `<@${newState.member.id}> has joined ${newState.channel}`,
          });

          // Add "in VC" role.
          await resolvedMember.addRole(
            resolvedMember.moderatedGuild.keyRoles.inVC,
            `Joined VC`,
          );
        }

        // Alert leave, if was but no longer in a channel (and, if 'silentLeave' isn't enabled).
        else if (
          oldState.channelId === voiceChannel.voice &&
          newState.channelId === null &&
          oldState.channel &&
          oldState.member
        ) {
          if (!voiceChannel.silentLeave) {
            const channel = await DiscordUtilities.getChannelById(
              voiceChannel.text,
              oldState.guild.id,
            );
            await channel?.send({
              content: `<@${oldState.member.id}> has left ${oldState.channel}`,
            });
          }

          // Remove "in VC" role.
          await resolvedMember.removeRole(
            resolvedMember.moderatedGuild.keyRoles.inVC,
            "Left VC",
          );
        }
      }
    },
  );
}
