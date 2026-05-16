export interface SmsPayload {
  to: string;
  message: string;
  tenantId: string;
  metadata?: any;
}

export interface SmsProvider {
  send(payload: SmsPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
