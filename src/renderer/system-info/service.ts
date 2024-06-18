import { createWindowChannels } from "@packages/sync"
import { Service } from "@packages/vue-class"
import { SystemInfoChannels } from "@services/system-info.channels.ts"

@Service()
export class SystemInfoService {
  readonly channels = createWindowChannels(SystemInfoChannels)
}
