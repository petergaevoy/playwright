import http from "http";
import express, { Request, Response } from "express";

interface WebhookServer {
  url: string;
  waitForWebhook: (timeoutMs?: number) => Promise<unknown>;
  getAllEvents: () => unknown[];
  close: () => void;
}

export function createWebhookServer(port = 3001): WebhookServer {
  const app = express();
  app.use(express.json());

  const receivedEvents: unknown[] = [];
  let resolveNext: ((data: unknown) => void) | null = null;

  app.post("/webhook", (req: Request, res: Response) => {
    const data = req.body;
    receivedEvents.push(data);

    if (resolveNext) {
      resolveNext(data);
      resolveNext = null;
    }

    res.status(200).send("OK");
  });

  const server = http.createServer(app);
  server.listen(port);

  const waitForWebhook = (timeoutMs = 10000): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for webhook event"));
      }, timeoutMs);

      resolveNext = (data) => {
        clearTimeout(timeout);
        resolve(data);
      };
    });
  };

  const getAllEvents = () => receivedEvents;

  const close = () => {
    server.close();
  };

  return {
    url: `http://localhost:${port}/webhook`,
    waitForWebhook,
    getAllEvents,
    close,
  };
}
