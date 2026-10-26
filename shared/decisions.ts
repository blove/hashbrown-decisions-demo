import { createSelectionSchema, s } from '@hashbrownai/core';

// The questions each decision asks. The browser and the server import the
// same definitions, so the server can pin them.

/** Context the router decision reads alongside the traveller's message. */
export const ROUTE_CONTEXT =
  'You route messages typed into Flight Desk, a travel assistant for Portland, Seattle and San Francisco flights. search means the traveller wants new flights. bookings means they ask about a trip they already booked: its status, a delay, a change or a cancellation. help means a general travel question such as baggage, check-in or ID rules. other is anything else.';

/**
 * Three questions about one message: what the traveller wants, whether it is
 * urgent, and how frustrated they sound.
 */
export const routeSchema = s.object('How to handle a traveller message', {
  intent: s.enumeration('What the traveller wants', {
    search: 'Find new flights between two cities',
    bookings: 'Check, change or cancel a trip they already booked',
    help: 'Ask a general question about baggage, check-in or travel rules',
    other: 'Anything else',
  }),
  urgent: s.boolean('The traveller needs help within the next few hours'),
  frustration: s.integer(
    'How frustrated the traveller sounds, from 1 (calm) to 5 (very upset)',
    { minimum: 1, maximum: 5 },
  ),
});

/** Context the view decision reads alongside the traveller's request. */
export const VIEW_CONTEXT =
  'You pick how Flight Desk shows a list of Portland to Seattle flights that the app already loaded.';

/** The ways the app can show the same flights. The model only picks an id. */
export const viewOptions = [
  {
    id: 'list',
    description: 'Every flight in departure order, for comparing times',
  },
  {
    id: 'cheapest',
    description: 'Only the single cheapest fare, highlighted',
  },
  {
    id: 'calendar',
    description: 'The lowest fare on each day of the week, for flexible dates',
  },
] as const;

/** The view ids the app knows how to render. */
export type ViewId = (typeof viewOptions)[number]['id'];

/** The pinned view question: one enumeration, `pick`. */
export const viewSchema = createSelectionSchema(viewOptions, 'one');

/** Context the card decision reads alongside each chat message. */
export const CARDS_CONTEXT =
  'You pick which cards best answer a message sent to Flight Desk. FlightCard fits a search for new flights. BookingCard fits a question about a trip the traveller already booked.';

/** The chat's cards, by the name and description the model reads. */
export const cardOptions = [
  {
    name: 'FlightCard',
    description: 'One flight from a findFlights result: number, route, times and fare',
    children: false,
  },
  {
    name: 'BookingCard',
    description: 'One of the traveller\'s booked trips from findBookings, with its status',
    children: false,
  },
] as const;

/** The pinned card questions: one yes or no question per card. */
export const cardsSchema = createSelectionSchema(cardOptions, { max: 2 });
