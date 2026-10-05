// Windows no dibuja los emojis de banderas: se usan SVG locales (flag-icons).
const FLAGS = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const urlOf = (code: string) => FLAGS[`/node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`];

export function Flag({ code, size = 'md' }: { code: string | undefined; size?: 'sm' | 'md' | 'lg' }) {
  const url = code ? urlOf(code) : undefined;
  if (!url) return <span className={`flag flag--${size} flag--world`} aria-hidden="true" />;
  return <img className={`flag flag--${size}`} src={url} alt="" loading="lazy" decoding="async" />;
}
