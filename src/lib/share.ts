import type { Article } from './types';

export async function shareArticle(article: Article): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const data = { title: article.title, text: article.title, url: article.url };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(article.url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
