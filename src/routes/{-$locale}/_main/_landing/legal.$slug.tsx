import browserCollections from "fumadocs-mdx:collections/browser"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useFumadocsLoader } from "fumadocs-core/source/client"
import { Calendar } from "lucide-react"
import { type LegalFrontmatter, legalSource } from "@/config/content/legal-source"
import blogCss from "@/config/style/blog.css?url"
import { getBlogMDXComponents } from "@/shared/components/blog/custom-mdx-content"

const serverLoader = createServerFn({ method: "GET" })
  .inputValidator((params: { slug: string; lang?: string }) => params)
  .handler(async ({ data: { slug, lang } }) => {
    const page = legalSource.getPage([slug], lang)
    if (!page) throw notFound()

    const frontmatter = page.data as LegalFrontmatter

    return {
      path: page.path,
      title: frontmatter.title,
      description: frontmatter.description,
      lastUpdated: frontmatter.lastUpdated.toISOString(),
    }
  })

export const Route = createFileRoute("/{-$locale}/_main/_landing/legal/$slug")({
  component: LegalPage,
  head: () => ({
    meta: [{ title: "Legal - VibeAny" }],
    links: [{ rel: "stylesheet", href: blogCss }],
  }),
  loader: async ({ params }) => {
    const data = await serverLoader({
      data: {
        slug: params.slug,
        lang: params.locale,
      },
    })
    await clientLoader.preload(data.path)
    return data
  },
})

const clientLoader = browserCollections.legal.createClientLoader({
  component({ default: MDX }) {
    return (
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <MDX components={getBlogMDXComponents()} />
      </article>
    )
  },
})

function LegalPage() {
  const data = useFumadocsLoader(Route.useLoaderData())

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <header className="mb-8 pb-8 border-b">
          <h1 className="text-4xl font-bold mb-4">{data.title}</h1>

          {data.description && (
            <p className="text-lg text-muted-foreground mb-4">{data.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>
              Last updated:{" "}
              <time dateTime={data.lastUpdated}>
                {new Date(data.lastUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
          </div>
        </header>

        {clientLoader.useContent(data.path)}
      </article>
    </div>
  )
}
