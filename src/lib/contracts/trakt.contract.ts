export interface ITraktSync {
  syncWatchlist(userId: string): Promise<boolean>;
  syncHistory(userId: string): Promise<boolean>;
  authWithTrakt(code: string): Promise<string>;
}
