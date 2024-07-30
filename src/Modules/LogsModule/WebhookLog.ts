import Bottleneck from "bottleneck";
import { EnvironmentVariables } from "../../Vars/EnvironmentVariables";
import { SystemUtils } from "../../Utilities/SystemUtils";
import { WikiLog } from ".";

export class WebhookLog {
  private static limiter = new Bottleneck({
    minTime: 361 * 2,
    maxConcurrent: 1,
  });

  constructor(message: string, url: EnvironmentVariables) {
    WebhookLog.limiter.schedule(async () => {
      const destinationURL = await SystemUtils.getEnvFromSupabase(url, false);
      if (destinationURL) {
        try {
          await fetch(destinationURL, {
            method: "POST",
            body: JSON.stringify({
              content: `\`\`\`${message}\`\`\``,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          WikiLog.apiError(error, "Modules/LogsModule/Webhook.ts");
        }
      }
    });
  }
}
