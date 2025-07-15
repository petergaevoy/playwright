import test, { expect } from '@playwright/test';
import { startServer, stopServer } from '../../utils/webhook/ngrok-client';
import { buildDeliveryWebhook } from '../../utils/webhook/webhook-builder';

let serverInstance: Awaited<ReturnType<typeof startServer>>;
let webhookUrl: string;

// Start the webhook server before all tests
test.beforeAll(async () => {
  serverInstance = await startServer();
  webhookUrl = serverInstance.url + "/webhook";
});

// Stop the webhook server after all tests
test.afterAll(async () => {
  await stopServer(serverInstance.server);
});

/**
 * Sends webhook requests sequentially with specified statuses to the given webhook URL.
 * Asserts that each request returns HTTP 200.
 *
 * @param webhookUrl - The webhook endpoint to send requests to
 * @param statuses - Array of status strings to send in the webhook payloads
 */
async function sendWebhookWithCustomStatus(webhookUrl: string, statuses: string[]) {
  for (const status of statuses) {
    const requestBody = buildDeliveryWebhook({ status });
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(200);
  }
}

test.describe("Webhook status flow", () => {
  test("should receive all expected webhook statuses", async () => {
    test.setTimeout(300_000);
    const expectedStatuses = ["created", "cooking", "delivering", "delivered"];

    // Start waiting for all expected webhook statuses in background
    const hooksPromise = serverInstance.waitForWebhookStatuses(expectedStatuses, 5);

    // Send webhooks with expected statuses sequentially
    await sendWebhookWithCustomStatus(webhookUrl, expectedStatuses);

    // Await until all expected statuses are received or timeout occurs
    const hooks = await hooksPromise;

    // Extract received statuses from webhooks
    const receivedStatuses = hooks.map(hook => hook.status);

    // Assert that all expected statuses were received
    expect(receivedStatuses).toEqual(expect.arrayContaining(expectedStatuses));
  });
});