import express from "express";
import ngrok from "ngrok";
import type { Server } from "http";

interface WebhookData {
  data?: {
    status?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const webhooks: WebhookData[] = [];

/**
 * Waits for webhook events containing the specified statuses within a given time limit.
 *
 * @param expectedStatuses - An array of strings representing the expected statuses (e.g., ["created", "delivering"]).
 * @param timeout - Timeout in **minutes** to wait before giving up.
 * @returns A promise that resolves with an array of all received webhooks (`WebhookData[]`) if all expected statuses were received in time.
 *
 * If the timeout is exceeded and not all statuses were received, the promise rejects with a `Timeout` error.
 *
 * Webhooks are collected from the internal shared storage `webhooks`, which is populated when POST requests are received at `/webhook`.
 *
 * Useful for verifying sequential status changes (e.g., delivery lifecycle) in e2e tests.
 *
 * Example:
 * ```ts
 * const receivedHooks = await waitForWebhookStatuses(["created", "cooking", "delivering", "delivered"], 5);
 * expect(receivedHooks.length).toBeGreaterThanOrEqual(4);
 * expect(receivedStatuses).toEqual(expect.arrayContaining(["cooking", "delivered"]));
 * ```
 */
export async function waitForWebhookStatuses(
  expectedStatuses: string[],
  timeout = 5,
): Promise<WebhookData[]> {
  const start = Date.now();
  const loggedStatuses = new Set<string>();

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const statuses = webhooks.map((w) => w.status).filter((s): s is string => Boolean(s));

      for (const status of statuses) {
        if (!loggedStatuses.has(status)) {
          console.log(`Webhook received with status: "${status}"`);
          loggedStatuses.add(status);
        }
      }

      const allReceived = expectedStatuses.every((s) => statuses.includes(s));

      if (allReceived) {
        clearInterval(interval);
        resolve([...webhooks]);
      }

      const timeoutMs = timeout * 1000 * 60;
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout: not all statuses received. Got: ${statuses}`));
      }
    }, 500);
  });
}

/**
 * Starts an Express server to receive webhook requests and exposes it publicly via ngrok.
 *
 * The server:
 * - Listens on port 3001.
 * - Accepts POST requests on the `/webhook` endpoint and stores request bodies in the internal `webhooks` array.
 * - Automatically uses the JSON parser (`express.json()`).
 * - Opens a public URL using ngrok.
 *
 * Returns an object with utilities:
 * - `server`: the running server instance (can be used to stop it later).
 * - `url`: the public ngrok URL to receive webhooks.
 * - `getWebhooks`: function returning a copy of all received webhooks.
 * - `clearWebhooks`: function to clear the internal webhook storage.
 * - `waitForWebhookStatuses`: utility to wait for a given set of statuses with a timeout.
 *
 * Example usage:
 * ```ts
 * const { url, getWebhooks, waitForWebhookStatuses } = await startServer();
 *
 * // Pass the `url` as webhookUrl when creating a new delivery
 * await createDelivery({ webhookUrl: url });
 *
 * const hooks = await waitForWebhookStatuses(["created", "cooking", "delivering", "delivered"], 5);
 * expect(hooks.length).toBeGreaterThanOrEqual(3);
 * ```
 */
export async function startServer() {
  const app = express();
  const port = 3001;

  app.use(express.json());

  app.post("/webhook", (req, res) => {
    const data = req.body;
    // console.log("Webhook received:", data);
    webhooks.push(data);
    res.status(200).send("OK");
  });

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  let url = await ngrok.connect(port);
    console.log(`ngrok tunnel opened at: ${url}`);

  return {
    server,
    url,
    getWebhooks: () => [...webhooks],
    clearWebhooks: () => webhooks.splice(0),
    waitForWebhookStatuses,
  };
}

/**
 * Stops the local server and closes the ngrok tunnel.
 *
 * @param server - The HTTP server instance (returned from `app.listen()`).
 *
 * This function:
 * 1. Closes the local HTTP server (`server.close()`).
 * 2. Disconnects the active ngrok session (`ngrok.disconnect()`).
 * 3. Fully terminates ngrok (`ngrok.kill()`), freeing up resources.
 *
 * Useful for cleaning up after tests or local development sessions.
 *
 * Example:
 * ```ts
 * const { server } = await startServer();
 * // ... run tests ...
 * await stopServer(server);
 * ```
 */
export async function stopServer(server: Server) {
  server.close();
  await ngrok.disconnect();
  await ngrok.kill();
}
