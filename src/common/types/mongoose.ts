export type PopulateQuery = Array<string | { path: string; select?: string; populate?: PopulateQuery }>;
