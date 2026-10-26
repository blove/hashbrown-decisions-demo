import type { Decision } from '@hashbrownai/core';
import type { routeSchema } from './decisions';

/** A decoded router answer: the typed value and its metadata. */
export type RouteResult = Decision.Result<typeof routeSchema>;

/** What Flight Desk does with a message. */
export type RouteAction =
  | { kind: 'idle' }
  | { kind: 'escalate' }
  | { kind: 'search' }
  | { kind: 'bookings' }
  | { kind: 'help' }
  | { kind: 'assistant' };

/** Below this intent confidence, the message goes to the assistant. */
export const CONFIDENCE_THRESHOLD = 0.7;

/** At or above this probability, an urgent message goes to a person. */
export const URGENT_THRESHOLD = 0.6;

/** At or above this frustration score, the message goes to a person. */
export const FRUSTRATION_THRESHOLD = 4;

/**
 * Turns the router's answer into an action. This is the app's policy, not
 * the model's: an urgent or frustrated traveller goes to a person, an unsure
 * or `other` answer goes to the assistant, and the rest open the matching
 * screen.
 *
 * @param result - The latest decision, or null before one.
 * @returns The action to take.
 */
export function routeAction(result: RouteResult | null): RouteAction {
  if (result === null) return { kind: 'idle' };
  const { value, meta } = result;
  if (
    meta.urgent.probability >= URGENT_THRESHOLD ||
    meta.frustration.score >= FRUSTRATION_THRESHOLD
  ) {
    return { kind: 'escalate' };
  }
  if (value.intent === 'other' || meta.intent.confidence < CONFIDENCE_THRESHOLD) {
    return { kind: 'assistant' };
  }

  return { kind: value.intent };
}
