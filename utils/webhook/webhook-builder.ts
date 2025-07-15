import { WebhookBody } from "../../types/webhook-types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Builds a valid `WebhookBody` object representing a payout event.
 *
 * This function returns a complete `WebhookBody` structure with default values,
 * which can be partially overridden by providing a `Partial<WebhookBody>` object.
 *
 * Useful for testing and mocking webhook events in end-to-end or integration tests.
 *
 * @param overrides - Optional partial object to override specific fields in the default payload.
 * @returns A fully constructed `WebhookBody` object with applied overrides.
 *
 * @example
 * const payout = buildDeliveryWebhook({ status: "paid", leaveAtTheDoor: false });
 * expect(payout.status).toBe("paid");
 */
export const buildDeliveryWebhook = (overrides: Partial<WebhookBody> = {}): WebhookBody => {
  return {
  orderId: uuidv4(),
  status: "delivering",
  paid: true,
  leaveAtTheDoor: true,
  deliveryAddress: 
    {
      city: "Sydney",
      street: "Wallaby Way",
      house: "42",
      flat: "3",
      entrance: "2",
      intercom: "2",
      comment: "Please ring and leave at the door if no answer"
    }
  ,
  clientInfo: {
    name: "Peter Gaevoy",
    phone: "+61 999 322 633"
  },
  ...overrides,
}
};