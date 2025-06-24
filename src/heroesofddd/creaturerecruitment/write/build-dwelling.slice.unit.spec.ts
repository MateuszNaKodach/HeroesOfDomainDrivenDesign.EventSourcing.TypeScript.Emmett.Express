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

void describe('Build Dwelling', () => {
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


  void describe('When not built dwelling', () => {
    const notBuiltDwelling: DwellingEvent[] = [];

    void it('builds dwelling', () =>
      given(notBuiltDwelling)
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

  void describe('When dwelling already built', () => {
    const builtDwelling: DwellingEvent[] = [
      {
        type: 'DwellingBuilt',
        data: {
          dwellingId,
          creatureId,
          costPerTroop,
        },
      },
    ];

    void it('throws exception when trying to build same dwelling again', () =>
      given(builtDwelling)
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
