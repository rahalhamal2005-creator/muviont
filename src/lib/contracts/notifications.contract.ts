export interface INotificationService {
  sendPushNotification(userId: string, title: string, body: string, actionUrl?: string): Promise<boolean>;
  subscribeUser(userId: string, subscription: any): Promise<boolean>;
}
