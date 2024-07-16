export interface DiscordModeratedGuild {
  id: string;
  name: string;
  keyChannels: {
    modChat: string;
    staffLog: string;
    adminChat: string;
    adminLog: string;
    antiRaid: string;
    chooseRoles: string;
    welcomeChannel: string;
    memberCount?: string;
    quran?: string;
  };
  keyRoles: {
    member: string;
    moderator: string;
    admin: string;
    developer: string;
    verified: string;
    insider: string;
    inVC: string;
    newMember: string;
  };
  trustedRoles: string[];
  keyVoiceChannels: {
    voice: string;
    text: string;
    wrongChannelAlerts?: boolean;
    silentLeave?: boolean;
  }[];
  jail?: {
    jailChannelId: string;
    jailLogChannelId: string;
    jailRoleId: string;
    jailVC: string;
  };
  applyWrongChannelAlerts?: boolean;
  applyMediaRestrictions?: boolean;
  antiRaidProtectedChannels: string[];
  choosableRoles: {
    category:
      | "Religion"
      | "Region"
      | "Age"
      | "Gender"
      | "Marital Status"
      | "Reminders"
      | "Other Languages";
    roleNames: string[];
    allowMultiple?: boolean;
  }[];
}
