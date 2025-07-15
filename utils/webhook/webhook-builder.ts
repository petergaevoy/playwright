import { DeliveryWebhook } from "../../types/delivery/webhook-types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Builds a sample delivery webhook payload for testing purposes.
 *
 * This function returns a complete `DeliveryWebhook` object with default values.
 * You can override any of the fields by passing a partial object to the `overrides` parameter.
 *
 * @param {Partial<DeliveryWebhook>} [overrides={}] - An optional object to override any of the default webhook fields.
 * @returns {DeliveryWebhook} A fully populated delivery webhook payload object, merged with any provided overrides.
 *
 * @example
 * // Get default payload
 * const payload = buildDeliveryWebhook();
 *
 * @example
 * // Override status and client phone number
 * const payload = buildDeliveryWebhook({
 *   status: "delivered",
 *   clientInfo: {
 *     phone: "+61 411 222 333"
 *   }
 * });
 */
export const buildDeliveryWebhook = (overrides: Partial<DeliveryWebhook> = {}): DeliveryWebhook => {
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