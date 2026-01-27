import { createServerFn } from "@tanstack/react-start"
import { configResolver, type PublicConfig } from "@/config/schema"
import { getConfigs } from "@/shared/model/config.model"

export const getConfigFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicConfig> => {
    const dbConfigs = await getConfigs()
    const values = configResolver.resolveAllConfigs(dbConfigs)
    const publicConfigs = configResolver.filterPublicConfigs(values)
    return publicConfigs as PublicConfig
  }
)
