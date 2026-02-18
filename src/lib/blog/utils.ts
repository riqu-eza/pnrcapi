export function calculateReadingTime(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, "");
  
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes); // Minimum 1 minute
}

export function generateMetaKeywords(
  title: string,
  content: string,
  categories: string[],
  tags: string[]
): string[] {
  // Combine all potential keywords
  const allKeywords = [
    ...title.toLowerCase().split(/\s+/),
    ...categories,
    ...tags,
  ];

  // Remove duplicates and common words
  const commonWords = ["the", "a", "an", "in", "on", "at", "to", "for", "of", "and"];
  const uniqueKeywords = Array.from(new Set(allKeywords))
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords

  return uniqueKeywords;
}