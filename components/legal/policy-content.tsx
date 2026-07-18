import type { PolicyContent } from '@/lib/site-content'

export function PolicyContentView({ content }: { content: PolicyContent }) {
  return (
    <>
      {content.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {content.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
    </>
  )
}
