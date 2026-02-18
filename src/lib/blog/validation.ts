export interface BlogPostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  categories?: string[];
  tags?: string[];
  relatedCityId?: string;
  relatedListings?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
  publishedAt?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: { [key: string]: string };
}

export function validateBlogPost(data: BlogPostInput): ValidationResult {
  const errors: { [key: string]: string } = {};

  // Required fields
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Title is required";
  } else if (data.title.length > 200) {
    errors.title = "Title must be less than 200 characters";
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.content = "Content is required";
  } else if (data.content.length < 100) {
    errors.content = "Content must be at least 100 characters";
  }

  // Optional fields validation
  if (data.excerpt && data.excerpt.length > 300) {
    errors.excerpt = "Excerpt must be less than 300 characters";
  }

  if (data.metaTitle && data.metaTitle.length > 60) {
    errors.metaTitle = "Meta title should be less than 60 characters for SEO";
  }

  if (data.metaDescription && data.metaDescription.length > 160) {
    errors.metaDescription = "Meta description should be less than 160 characters for SEO";
  }

  // Status validation
  if (data.status && !["draft", "published", "scheduled"].includes(data.status)) {
    errors.status = "Status must be draft, published, or scheduled";
  }

  // Scheduled post must have publishedAt date
  if (data.status === "scheduled" && !data.publishedAt) {
    errors.publishedAt = "Scheduled posts must have a publish date";
  }

  // Arrays validation
  if (data.categories && !Array.isArray(data.categories)) {
    errors.categories = "Categories must be an array";
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.tags = "Tags must be an array";
  }

  if (data.relatedListings && !Array.isArray(data.relatedListings)) {
    errors.relatedListings = "Related listings must be an array";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}