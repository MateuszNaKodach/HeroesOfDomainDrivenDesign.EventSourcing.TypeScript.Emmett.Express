import {
  DeciderSpecification,
  IllegalStateError,
} from '@event-driven-io/emmett';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import type { DwellingEvent } from '../events';
import { decide, evolve, initialState } from './build-dwelling.slice';

const given = DeciderSpecification.for({
  decide,
  evolve,
  initialState,
});

void describe('Slice: Build Dwelling', () => {
  const now = new Date();
  const dwellingId = randomUUID();
  const creatureId = randomUUID();
  const costPerTroop = {
    gold: 100,
    wood: 50,
    ore: 0,
    mercury: 0,
    sulfur: 0,
    crystal: 0,
    gems: 0,
  };

  void describe('given not built dwelling', () => {
    const events: DwellingEvent[] = [];

    void it('when build dwelling, then built', () =>
      given(events)
        .when({
          type: 'BuildDwelling',
          data: {
            dwellingId,
            creatureId,
            costPerTroop,
          },
          metadata: { gameId: randomUUID(), now },
        })
        .then([
          {
            type: 'DwellingBuilt',
            data: {
              dwellingId,
              creatureId,
              costPerTroop,
            },
          },
        ]));
  });

  void describe('given already built dwelling', () => {
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

    void it('when build same dwelling one more time then exception', () =>
      given(events)
        .when({
          type: 'BuildDwelling',
          data: {
            dwellingId,
            creatureId,
            costPerTroop,
          },
          metadata: { gameId: randomUUID(), now },
        })
        .thenThrows<IllegalStateError>(
          (error) => error.message === 'Only not built building can be build',
        ));
  });
});
