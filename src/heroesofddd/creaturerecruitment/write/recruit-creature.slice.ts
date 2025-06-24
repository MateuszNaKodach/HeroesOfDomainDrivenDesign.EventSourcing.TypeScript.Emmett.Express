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
import {
  type Cost,
  isSameCost,
  multiplyCost,
} from '../../shared/domain/valueobjects/resources';
import type { DwellingEvent } from '../events';

////////////////////////////////////////////
////////// Domain
///////////////////////////////////////////

export type RecruitCreature = Command<
  'RecruitCreature',
  {
    dwellingId: string;
    creatureId: string;
    armyId: string;
    quantity: number;
    expectedCost: Cost;
  },
  CommandMetadata
>;

export type State = {
  creatureId: string;
  availableCreatures: number;
  costPerTroop: Cost;
};

export const initialState: () => State = () => ({
  creatureId: '',
  availableCreatures: 0,
  costPerTroop: {
    gold: 0,
    wood: 0,
    ore: 0,
    mercury: 0,
    sulfur: 0,
    crystal: 0,
    gems: 0,
  },
});

export const decide = (
  { data: command }: RecruitCreature,
  state: State,
): DwellingEvent[] => {
  if (
    state.creatureId != command.creatureId ||
    state.availableCreatures < command.quantity
  ) {
    throw new IllegalStateError(
      `Recruit creatures cannot exceed available creatures`,
    );
  }

  const recruitCost: Cost = multiplyCost(state.costPerTroop, command.quantity);
  if (!isSameCost(command.expectedCost, recruitCost)) {
    throw new IllegalStateError(
      'Recruit cost cannot differ than expected cost',
    );
  }

  return [
    {
      type: 'CreatureRecruited',
      data: {
        dwellingId: command.dwellingId,
        creatureId: command.creatureId,
        toArmy: command.armyId,
        quantity: command.quantity,
        totalCost: recruitCost,
      },
    },
    {
      type: 'AvailableCreaturesChanged',
      data: {
        dwellingId: command.dwellingId,
        creatureId: command.creatureId,
        changedBy: -command.quantity,
        changedTo: state.availableCreatures - command.quantity,
      },
    },
  ];
};

export const evolve = (
  state: State,
  { type, data: event }: DwellingEvent,
): State => {
  switch (type) {
    case 'DwellingBuilt':
      return {
        ...state,
        creatureId: event.creatureId,
        costPerTroop: event.costPerTroop,
      };
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

type RecruitCreatureRequest = Request<
  Partial<{ gameId: string; dwellingId: string }>,
  unknown,
  Partial<{
    creatureId: string;
    armyId: string;
    quantity: number;
    expectedCost: Record<string, number | undefined>;
  }>
>;

export const recruitCreatureEndpoint =
  (eventStore: EventStore, currentTime: () => Date): WebApiSetup =>
  (router: Router) => {
    router.put(
      '/games/:gameId/dwellings/:dwellingId/creature-recruitments',
      on(async (request: RecruitCreatureRequest) => {
        const gameId = assertNotEmptyString(request.params.gameId);
        const dwellingId = assertNotEmptyString(request.params.dwellingId);
        const armyId = assertNotEmptyString(request.body.armyId);
        const creatureId = assertNotEmptyString(request.body.creatureId);
        const quantity = assertPositiveNumber(request.body.quantity);
        const expectedCost = request.body.expectedCost as Cost; // todo: validation!

        const command: RecruitCreature = {
          type: 'RecruitCreature',
          data: {
            dwellingId,
            creatureId,
            armyId,
            quantity,
            expectedCost,
          },
          metadata: { gameId, now: currentTime() },
        };

        const streamId = `game:${gameId}:creature-recruitment:dwelling${dwellingId}`;
        await handle(eventStore, streamId, (state) => decide(command, state));

        return NoContent();
      }),
    );
  };
