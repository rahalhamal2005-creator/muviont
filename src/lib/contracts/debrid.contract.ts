export interface IDebridService {
  getStreamUrls(query: string): Promise<{ url: string; quality: string; size: number }[]>;
}
