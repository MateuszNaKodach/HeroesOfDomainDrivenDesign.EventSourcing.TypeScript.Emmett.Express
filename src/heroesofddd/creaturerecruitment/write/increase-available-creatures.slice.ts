import {
  assertNotEmptyString,
  assertPositiveNumber,
  type Command,
  CommandHandler,
  type EventStore,
  IllegalStateError,
} from '@event-driven-io/emmett';
import {
  NoContent,
  on,
  type WebApiSetup,
} from '@event-driven-io/emmett-expressjs';
import { type Request, type Router } from 'express';
import type { CommandMetadata } from '../../shared/application/command-metadata';
import type { DwellingEvent } from '../events';

////////////////////////////////////////////
////////// Domain
///////////////////////////////////////////

export type IncreaseAvailableCreatures = Command<
  'IncreaseAvailableCreatures',
  {
    dwellingId: string;
    creatureId: string;
    increaseBy: number;
  },
  CommandMetadata
>;

export type State = { isBuilt: boolean; availableCreatures: number };

export const initialState: () => State = () => ({
  isBuilt: false,
  availableCreatures: 0,
});

export const decide = (
  { data: command }: IncreaseAvailableCreatures,
  state: State,
): DwellingEvent => {
  if (!state.isBuilt) {
    throw new IllegalStateError(
      'Only built dwelling can have available creatures',
    );
  }

  // todo: check creatureId for the dwelling!

  return {
    type: 'AvailableCreaturesChanged',
    data: {
      dwellingId: command.dwellingId,
      creatureId: command.creatureId,
      changedBy: +command.increaseBy,
      changedTo: state.availableCreatures + command.increaseBy,
    },
  };
};

export const evolve = (
  state: State,
  { type, data: event }: DwellingEvent,
): State => {
  switch (type) {
    case 'DwellingBuilt':
      return { ...state, isBuilt: true };
    case 'AvailableCreaturesChanged':
      return { ...state, availableCreatures: event.changedTo };
    default:
      return state;
  }
};

////////////////////////////////////////////
////////// Application
///////////////////////////////////////////

const handle = CommandHandler({ evolve, initialState });

////////////////////////////////////////////
////////// Presentation - REST API
///////////////////////////////////////////

type IncreaseAvailableCreaturesRequest = Request<
  Partial<{ gameId: string; dwellingId: string }>,
  unknown,
  Partial<{ creatureId: string; increaseBy: number }>
>;

export const increaseAvailableCreaturesEndpoint =
  (eventStore: EventStore, currentTime: () => Date): WebApiSetup =>
  (router: Router) => {
    router.put(
      '/games/:gameId/dwellings/:dwellingId/available-creatures-increases',
      on(async (request: IncreaseAvailableCreaturesRequest) => {
        const gameId = assertNotEmptyString(request.params.gameId);
        const dwellingId = assertNotEmptyString(request.params.dwellingId);
        const creatureId = assertNotEmptyString(request.body.creatureId);
        const increaseBy = assertPositiveNumber(request.body.increaseBy);

        const command: IncreaseAvailableCreatures = {
          type: 'IncreaseAvailableCreatures',
          data: {
            dwellingId,
            creatureId,
            increaseBy,
          },
          metadata: { gameId, now: currentTime() },
        };

        const streamId = `game:${gameId}:creature-recruitment:dwelling${dwellingId}`;
        await handle(eventStore, streamId, (state) => decide(command, state));

        return NoContent();
      }),
    );
  };
