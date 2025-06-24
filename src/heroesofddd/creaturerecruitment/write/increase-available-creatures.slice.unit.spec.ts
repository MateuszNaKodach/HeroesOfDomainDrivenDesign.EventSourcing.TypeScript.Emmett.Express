import {
  DeciderSpecification,
  IllegalStateError,
} from '@event-driven-io/emmett';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import type { DwellingEvent } from '../events';
import {
  decide,
  evolve,
  initialState,
} from './increase-available-creatures.slice';

const given = DeciderSpecification.for({
  decide,
  evolve,
  initialState,
});

void describe('Slice: Increase Available Creatures', () => {
  const now = new Date();
  const gameId = randomUUID();
  const dwellingId = randomUUID();
  const creatureId = 'angel';
  const costPerTroop = {
    gold: 3000,
    wood: 0,
    ore: 0,
    mercury: 0,
    sulfur: 0,
    crystal: 0,
    gems: 1,
  };

  void describe('given not built dwelling', () => {
    const events: DwellingEvent[] = [];

    void it('when increase available creatures, then exception', () =>
      given(events)
        .when({
          type: 'IncreaseAvailableCreatures',
          data: {
            dwellingId,
            creatureId,
            increaseBy: 3,
          },
          metadata: { gameId, now },
        })
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message ===
            'Only built dwelling can have available creatures',
        ));
  });

  void describe('given built dwelling', () => {
    const events: DwellingEvent[] = [
      {
        type: 'DwellingBuilt',
        data: {
          dwellingId,
          creatureId,
          costPerTroop,
        },
      },
    ];

    void it('when increase available creatures, then available creatures changed', () =>
      given(events)
        .when({
          type: 'IncreaseAvailableCreatures',
          data: {
            dwellingId,
            creatureId,
            increaseBy: 3,
          },
          metadata: { gameId, now },
        })
        .then([
          {
            type: 'AvailableCreaturesChanged',
            data: {
              dwellingId,
              creatureId,
              changedBy: 3,
              changedTo: 3,
            },
          },
        ]));
  });

  void describe('given built dwelling with available creatures', () => {
    const events: DwellingEvent[] = [
      {
        type: 'DwellingBuilt',
        data: {
          dwellingId,
          creatureId,
          costPerTroop,
        },
      },
      {
        type: 'AvailableCreaturesChanged',
        data: {
          dwellingId,
          creatureId,
          changedBy: 1,
          changedTo: 1,
        },
      },
    ];

    void it('when increase available creatures, then available creatures changed to cumulative amount', () =>
      given(events)
        .when({
          type: 'IncreaseAvailableCreatures',
          data: {
            dwellingId,
            creatureId,
            increaseBy: 3,
          },
          metadata: { gameId, now },
        })
        .then([
          {
            type: 'AvailableCreaturesChanged',
            data: {
              dwellingId,
              creatureId,
              changedBy: 3,
              changedTo: 4,
            },
          },
        ]));
  });
});
