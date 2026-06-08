export interface EnglishDraft {
  title: string;
  tags: string[];
  body_markdown: string;
  source_url?: string;
}

export interface JapaneseDraft {
  title: string;
  body: string;
  tags: string[];
  source_url: string;
}

export interface SkipPayload {
  skip: true;
  reason: string;
}
