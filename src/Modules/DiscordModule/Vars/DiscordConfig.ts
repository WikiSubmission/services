import { DiscordModeratedGuild } from "../Types/ModeratedGuild";

export class DiscordConfig {
  static mediaRestrictionHours = 8;
  static newMemberPeriodLengthDays = 60;
  static wikiSubmissionMaintainers = [
    "732656585146368051",
    "911267873303953459",
    "734316604828942372",
    "346413770089824256",
  ];
  static knownGuilds: DiscordModeratedGuild[] = [
    {
      id: "1080271049377202177",
      name: "WikiSubmission Dev Team",
      keyChannels: {
        adminChat: "1225605572926247044",
        modChat: "1225605613225246800",
        adminLog: "1225605647282737232",
        staffLog: "1225605673673560124",
        antiRaid: "1232715702700478525",
        memberCount: "1080271050492878892",
        welcomeChannel: "1238252029605056643",
        chooseRoles: "1250474126565703690",
        quran: "1252787451097776200",
      },
      keyRoles: {
        admin: "1080271291086544936",
        moderator: "1090377520626544671",
        developer: "1225605761242107904",
        member: "1093055741348286474",
        verified: "1093497727498850304",
        insider: "1248354660700393505",
        inVC: "1250556843974201384",
        newMember: "1160181147419025470",
      },
      jail: {
        jailChannelId: "1225605871418216528",
        jailLogChannelId: "1225813505144520798",
        jailRoleId: "1154133193000222770",
        jailVC: "1232705509702893621",
      },
      trustedRoles: ["1090377520626544671"],
      keyVoiceChannels: [
        {
          voice: "1144686042104995850",
          text: "1250562692347990047",
          wrongChannelAlerts: true,
        },
        {
          voice: "1080271050492878892",
          text: "1250562692347990047",
          wrongChannelAlerts: true,
        },
      ],
      antiRaidProtectedChannels: [
        "1093055182440505414",
        "1093055191802191892",
        "1093055208965275659",
      ],
      applyWrongChannelAlerts: true,
      applyMediaRestrictions: true,
      choosableRoles: [
        {
          category: "Religion",
          roleNames: ["Submitter", "Christian", "Jewish"],
        },
        {
          category: "Age",
          roleNames: ["13-17", "18-24", "25-39", "40+"],
        },
        {
          category: "Region",
          roleNames: ["Americas", "Europe", "Asia", "Middle East", "Africa"],
        },
        {
          category: "Gender",
          roleNames: ["Male", "Female"],
        },
        {
          category: "Marital Status",
          roleNames: ["Married", "Single"],
        },
        {
          category: "Other Languages",
          roleNames: ["Turkish", "Arabic", "Persian", "Urdu"],
          allowMultiple: true,
        },
        {
          category: "Reminders",
          roleNames: ["Recitation Ping", "Discussion Ping"],
          allowMultiple: true,
        },
      ],
    },
    {
      id: "911268076933230662",
      name: "Submission",
      keyChannels: {
        adminChat: "915730404990935050",
        modChat: "916018687222378506",
        adminLog: "935485424560906280",
        staffLog: "935483998711468132",
        antiRaid: "1093108437589692486",
        memberCount: "935904300964651008",
        welcomeChannel: "1184176347157889074",
        chooseRoles: "935279135012565052",
        quran: "911278762023325696",
      },
      keyRoles: {
        admin: "915624653601538088",
        moderator: "915628797422874625",
        developer: "1126691963375206501",
        member: "915631652812750908",
        verified: "1093512456627822644",
        insider: "985705257495564349",
        inVC: "922911805653807134",
        newMember: "1160180863926030336",
      },
      jail: {
        jailChannelId: "1154132574365560956",
        jailLogChannelId: "1181639949599117502",
        jailRoleId: "1154132678375903232",
        jailVC: "1156330323278299317",
      },
      trustedRoles: [
        "985705257495564349", // insider
        "915628797422874625", // mod
        "915624653601538088", // admin
        "1126691963375206501", // developer
      ],
      keyVoiceChannels: [
        // VC1
        {
          voice: "911268076933230667",
          text: "915639051967676496",
          wrongChannelAlerts: true,
        },
        // VC2
        {
          voice: "915635168990081054",
          text: "915639080119849030",
          wrongChannelAlerts: true,
        },
        // VC3
        { voice: "1075949658792284242", text: "1075986349607358544" },
        // VC4
        {
          voice: "1082495437317083256",
          text: "1082833497812648046",
          silentLeave: true,
        },
        // VCLounge
        { voice: "965278781071847474", text: "928350359309676614" },
        // VCSubmitters
        { voice: "985705908560617492", text: "985705731330293870" },
        // VCTestimOlanlar
        { voice: "1019177238526181466", text: "1025525849283362816" },
      ],
      antiRaidProtectedChannels: [
        "915639051967676496",
        "915639080119849030",
        "1075986349607358544",
        "1082833497812648046",
        "911276544415109151",
        "911276795238686760",
        "915644216166739998",
        "917555446028570664",
        "911279102240104458",
        "911279301394067496",
        "940659538279952454",
        "915644608749387776",
        "987416799870062602",
        "915696419418038322",
        "1009132138236498042",
        "924097089150009454",
        "924811671560671292",
        "924811671560671292",
        "1016004950725242900",
        "923972048563355698",
        "931398522832551947",
        "924131039125839923",
        "911278762023325696",
        "1184176347157889074",
        "1162347904594366484",
        "1155523101728186379",
        "915697450675736596",
        "915644696913649715",
        "1123509845048426496",
      ],
      applyWrongChannelAlerts: true,
      applyMediaRestrictions: true,
      choosableRoles: [
        {
          category: "Religion",
          roleNames: [
            "Submitter",
            "Traditional Muslim - Sunni",
            "Traditional Muslim - Shia",
            "Traditional Muslim - Other",
            "Quranist",
            "Christian",
            "Christian - Nontrinitarian",
            "Jewish",
            "Buddhist",
            "Hindu",
            "Bahai",
            "Sikh",
            "Agnostic / Atheist",
            "Undecided / Exploring",
            "Other Religion",
          ],
        },
        {
          category: "Age",
          roleNames: ["13-17", "18-24", "25-29", "30-39", "40+"],
        },
        {
          category: "Region",
          roleNames: [
            "Americas",
            "Europe",
            "Middle East",
            "Asia",
            "Africa",
            "Australia",
          ],
        },
        {
          category: "Gender",
          roleNames: ["Male", "Female"],
        },
        {
          category: "Marital Status",
          roleNames: ["Single", "Married"],
        },
        {
          category: "Other Languages",
          roleNames: [
            "Turkish",
            "Persian",
            "French",
            "Albanian",
            "Spanish",
            "Bengali",
            "Arabic",
            "Urdu",
            "Swedish",
            "German",
            "Bahasa",
            "Kurdish",
            "Hebrew",
            "Hausa",
            "Hindi",
            "Ukranian",
            "Bosnian",
          ],
        },
        {
          category: "Reminders",
          roleNames: [
            "Quran Study Ping",
            "Discussion Ping",
            "Recitation Ping",
            "Meditation Ping",
          ],
        },
      ],
    },
  ];
}
