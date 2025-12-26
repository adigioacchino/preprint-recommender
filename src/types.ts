export interface PreprintPaper {
  title: string;
  abstract: string;
  authors: string[];
  published: Date;
  link: string;
  embedding: number[] | null;
}
