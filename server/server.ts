import type { RunAgentInput } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import type { DecidableSchema } from '@hashbrownai/core';
import { HashbrownOpenAI } from '@hashbrownai/openai';
import { DecisionError, HashbrownTypeSafe } from '@hashbrownai/typesafe';
import express from 'express';
import {
  CARDS_CONTEXT,
  cardsSchema,
  ROUTE_CONTEXT,
  routeSchema,
  VIEW_CONTEXT,
  viewSchema,
} from '../shared/decisions';

// A local development server. It is never deployed: there is no
// authentication, and the chat route trusts the browser's prompt and tools.

const openAiKey = process.env['OPENAI_API_KEY'];
const openAiModel = process.env['OPENAI_MODEL'] ?? 'gpt-5-mini';
const typeSafeKey = process.env['TYPESAFE_API_KEY'];
const typeSafeModel = process.env['TYPESAFE_MODEL'] ?? 'jev-1.14.0';
if (!openAiKey || !typeSafeKey) {
  throw new Error('Set OPENAI_API_KEY and TYPESAFE_API_KEY in .env');
}

/** The questions and context each kind of decision is pinned to. */
const KINDS: Record<string, { schema: DecidableSchema; system: string }> = {
  route: { schema: routeSchema, system: ROUTE_CONTEXT },
  view: { schema: viewSchema, system: VIEW_CONTEXT },
  cards: { schema: cardsSchema, system: CARDS_CONTEXT },
};

/** The text to decide about: the browser's `state.input`, or the state itself. */
function inputOf(body: unknown): string | undefined {
  const state = (body as { state?: unknown } | null)?.state;
  if (typeof state === 'string') return state;
  const input = (state as { input?: unknown } | null)?.input;

  return typeof input === 'string' ? input : undefined;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/api/decide/:kind', async (req, res) => {
  const pinned = KINDS[req.params.kind];
  const input = inputOf(req.body);
  if (!pinned || input === undefined) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }
  const controller = new AbortController();
  res.once('close', () => {
    if (!res.writableEnded) controller.abort();
  });
  const started = performance.now();

  try {
    const decision = await HashbrownTypeSafe.decide({
      apiKey: typeSafeKey,
      model: typeSafeModel,
      // Our questions and context; only the traveller's words come from the browser.
      schema: pinned.schema,
      request: { state: { system: pinned.system, input } },
      maxRequestChars: 16_000,
      signal: controller.signal,
    });
    const ms = Math.round(performance.now() - started);
    console.log(`[decide] ${req.params.kind} ${ms}ms ${JSON.stringify(input)}`);
    res.setHeader('Server-Timing', `decide;dur=${ms}`);
    res.json(decision);
  } catch (error) {
    if (controller.signal.aborted) return;
    if (error instanceof DecisionError) {
      res.status(error.status).json({ error: error.code });
    } else {
      console.error('[decide] failed', error);
      res.status(500).json({ error: 'internal' });
    }
  }
});

app.post('/api/chat', async (req, res) => {
  const controller = new AbortController();
  res.once('close', () => {
    if (!res.writableEnded) controller.abort();
  });
  const encoder = new EventEncoder();
  res.setHeader('Content-Type', encoder.getContentType());
  res.setHeader('Cache-Control', 'no-cache, no-store');

  try {
    const stream = HashbrownOpenAI.stream.text({
      apiKey: openAiKey,
      model: openAiModel,
      input: req.body as RunAgentInput,
      signal: controller.signal,
    });
    for await (const event of stream) {
      if (controller.signal.aborted) break;
      res.write(encoder.encodeSSE(event));
    }
    res.end();
  } catch (error) {
    console.error('[chat] failed', error);
    if (!res.headersSent) res.status(500).end('Could not start the response');
    else res.destroy();
  }
});

app.listen(3001, '127.0.0.1', () => {
  console.log('Flight Desk server: http://127.0.0.1:3001');
});
