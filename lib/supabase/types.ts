export type PostStatus =
  | "draft"
  | "scored"
  | "queued"
  | "published"
  | "archived"
  | "rejected";

export type TopicStatus = "proposed" | "accepted" | "rejected" | "drafted";

export type PipelineStage = "research" | "draft" | "score" | "publish";

export type SourceType = "rss" | "sitemap" | "scrape";

export interface Rubric {
  source_quality: number;
  citation_coverage: number;
  risk: number;
  fact_check: number;
  editorial: number;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body_md: string;
  body_html: string | null;
  cover_image_url: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  category_id: string | null;
  status: PostStatus;
  confidence_score: number | null;
  rubric: Rubric | null;
  auto_published: boolean;
  published_at: string | null;
  author_id: string | null;
  topic_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  source_type: SourceType;
  feed_url: string | null;
  domain_authority: number;
  trust_tier: 1 | 2 | 3;
  is_active: boolean;
  last_crawled_at: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string | null;
  suggested_angle: string | null;
  source_refs: Array<{ url: string; title: string; source_id?: string }>;
  status: TopicStatus;
  medical_legal_flag: boolean;
  created_at: string;
}

export interface Citation {
  id: string;
  post_id: string;
  claim: string;
  url: string;
  source_title: string | null;
  source_tier: 1 | 2 | 3 | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  position: number;
}
