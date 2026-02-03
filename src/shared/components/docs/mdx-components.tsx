import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"
import { ImageZoom } from "fumadocs-ui/components/image-zoom"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import { CommandTab } from "./command-tab"
import { GridItem } from "./grid-item"
import { SecretGenerator } from "./secret-generator"
import { TechStack } from "./tech-stack"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Custom Image Component
    img: (props) => (
      <ImageZoom
        className="rounded-md"
        {...(props as any)}
      />
    ),
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    CommandTab: (props) => {
      return <CommandTab {...props} />
    },
    GridItem: (props) => {
      return <GridItem {...props} />
    },
    TechStack: (props) => {
      return <TechStack {...props} />
    },
    SecretGenerator: () => {
      return <SecretGenerator />
    },
    ...components,
  }
}
