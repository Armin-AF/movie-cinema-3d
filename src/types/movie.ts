export interface ReflectionLog {
  date: string;
  lifeStage: string;
  note: string;
}

export interface MovieEntry {
  slug: string;
  title: string;
  year: number;
  director: string;
  poster: string;
  trailerId: string;
  moods: string[];
  lifeContext: string;
  memorableQuote: string;
  soundtrackHighlight: string;
  soundtrackId?: string;
  reflections: ReflectionLog[];
}