import {
  assertNotEmptyString,
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
import type { Cost } from '../../shared/domain/valueobjects/resources';
import type { DwellingEvent } from '../events';

////////////////////////////////////////////
////////// Domain
///////////////////////////////////////////

export type BuildDwelling = Command<
  'BuildDwelling',
  {
    dwellingId: string;
    creatureId: string;
    costPerTroop: Cost;
  },
  CommandMetadata
>;

export type State = { isBuilt: boolean };

export const initialState: () => State = () => ({
  isBuilt: false,
});

export const decide = (
  { data: command }: BuildDwelling,
  state: State,
): DwellingEvent => {
  if (state.isBuilt) {
    throw new IllegalStateError('Only not built building can be build');
  }

  return {
    type: 'DwellingBuilt',
    data: {
      dwellingId: command.dwellingId,
      creatureId: command.creatureId,
      costPerTroop: command.costPerTroop,
    },
  };
};

export const evolve = (state: State, { type }: DwellingEvent): State => {
  switch (type) {
    case 'DwellingBuilt':
      return { isBuilt: true };
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

type BuildDwellingRequest = Request<
  Partial<{ gameId: string; dwellingId: string }>,
  unknown,
  Partial<{
    creatureId: string;
    costPerTroop: Record<string, number | undefined>;
  }>
>;

export const buildDwellingEndpoint =
  (eventStore: EventStore, currentTime: () => Date): WebApiSetup =>
  (router: Router) => {
    router.put(
      '/games/:gameId/dwellings/:dwellingId',
      on(async (request: BuildDwellingRequest) => {
        const gameId = assertNotEmptyString(request.params.gameId);
        const dwellingId = assertNotEmptyString(request.params.dwellingId);
        const creatureId = assertNotEmptyString(request.body.creatureId);
        const costPerTroop = request.body.costPerTroop as Cost; // todo: validation!

        const command: BuildDwelling = {
          type: 'BuildDwelling',
          data: {
            dwellingId,
            creatureId,
            costPerTroop,
          },
          metadata: { gameId, now: currentTime() },
        };

        const streamId = `CreatureRecruitment:Dwelling-${gameId}:${dwellingId}`;
        await handle(eventStore, streamId, (state) => decide(command, state));

        return NoContent();
      }),
    );
  };
