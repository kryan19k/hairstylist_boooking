/** Renders structured data for search engines. `<` is escaped so content can never break out of the tag. */
export default function JsonLd({ data }: { data: (object | undefined)[] }) {
  return (
    <>
      {data.filter(Boolean).map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
