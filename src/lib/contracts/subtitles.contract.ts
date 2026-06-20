export interface ISubtitlesService {
  searchSubtitles(mediaId: string, language: string): Promise<{ url: string; label: string; lang: string }[]>;
}
