import { SmsProvider, SmsPayload } from './SmsProvider';

export class AfricasTalkingProvider implements SmsProvider {
  async send(payload: SmsPayload) {
    console.log(`[SMS] Sending via Africa's Talking to ${payload.to} (Tenant: ${payload.tenantId})`);
    
    // In a real implementation, we would use the africastalking SDK here
    // const options = {
    //   apiKey: process.env.AT_API_KEY,
    //   username: process.env.AT_USERNAME
    // };
    // const at = require('africastalking')(options);
    
    // For Phase 1, we simulate a successful dispatch
    return { 
      success: true, 
      messageId: `at_${Math.random().toString(36).substr(2, 9)}` 
    };
  }
}
