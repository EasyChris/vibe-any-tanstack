import { legal } from "fumadocs-mdx:collections/server"
import { loader } from "fumadocs-core/source"
import { toFumadocsSource } from "fumadocs-mdx/runtime/server"
import { i18n } from "@/shared/lib/i18n"

export type LegalFrontmatter = {
  title: string
  description?: string
  lastUpdated: Date
}

export const legalSource = loader({
  baseUrl: "/legal",
  source: toFumadocsSource(legal, []),
  i18n,
})

export function getLegalPage(slug: string, lang?: string) {
  const language = lang || i18n.defaultLanguage
  return legalSource.getPage([slug], language)
}
