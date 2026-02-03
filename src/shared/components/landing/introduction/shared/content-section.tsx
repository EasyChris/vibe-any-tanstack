import { useId } from "react"
import { cn } from "@/shared/lib/utils"
import type { ContentSectionProps } from "@/shared/types/landing"
/**
 * ContentSection - Displays title, description and feature list
 * with accessibility support and semantic structure
 */
export const ContentSection = ({ title, description, features }: ContentSectionProps) => {
  const titleId = useId()

  return (
    <div className="flex flex-col justify-center space-y-6">
      {/* Main content header */}
      <header className="space-y-4">
        <h2
          id={titleId}
          className={cn("text-3xl font-bold tracking-tight", "sm:text-4xl", "lg:text-5xl")}
        >
          {title}
        </h2>

        <p
          className={cn("text-lg text-muted-foreground", "sm:text-base")}
          aria-describedby={titleId}
        >
          {description}
        </p>
      </header>

      {/* Features list */}
      <section
        className="grid grid-cols-1 gap-4"
        aria-label="Features list"
      >
        {features.map((feature, index) => {
          const featureTitleId = `${titleId}-feature-${index}`

          return (
            <article
              key={feature.title}
              className="space-y-2"
              aria-labelledby={featureTitleId}
            >
              <h3
                id={featureTitleId}
                className="text-lg font-semibold"
              >
                {feature.title}
              </h3>

              <p
                className={cn("text-sm text-muted-foreground leading-relaxed")}
                aria-describedby={featureTitleId}
              >
                {feature.description}
              </p>
            </article>
          )
        })}
      </section>
    </div>
  )
}
