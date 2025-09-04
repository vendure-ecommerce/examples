import { ScheduledTask, RequestContextService } from "@vendure/core";

import { CmsSyncService } from "../services/cms-sync.service";

export const syncCmsTask = new ScheduledTask({
  // Give your task a unique ID
  id: "sync-cms",
  description: "Sync CMS data",
  schedule: (cron) => cron.everyWeekDayAt(0, 0),
  async execute({ injector }) {
    const cmsSyncService = injector.get(CmsSyncService);
    // const ctx = await injector.get(RequestContextService).create({
    //   apiType: "admin",
    // });
    const result = await cmsSyncService.syncAllEntityTypes();
    return { result };
  },
});
