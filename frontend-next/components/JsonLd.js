/** Embeds a JSON-LD <script> directly into server HTML. SSR-safe. */
export default function JsonLd({ data, id }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      data-testid={id || 'jsonld'}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
