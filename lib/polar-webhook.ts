import crypto from 'crypto';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'


// Helper function to verify Polar webhook signature
export function verifyPolarWebhook(body: any, headers: any, secret: string): boolean {
    try {
        const event = validateEvent(
            body,
            headers,
            secret ?? '',
        )

        return !!event;
    } catch (error) {
        if (error instanceof WebhookVerificationError) {
            console.warn("[Polar Webhook] Webhook verification error:", error.message);
            return false;
        }
        console.error("[Polar Webhook] Unexpected error during verification:", error);
        return false;
    }

}

// Polar webhook event types
export interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    amount?: number;
    metadata?: {
      plan?: string;
      credits?: string;
      buyerId?: string;
    };
    customer?: {
      email: string;
      id: string;
    };
  };
}