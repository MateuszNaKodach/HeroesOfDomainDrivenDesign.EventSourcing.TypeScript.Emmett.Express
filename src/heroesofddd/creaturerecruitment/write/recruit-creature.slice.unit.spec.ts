import {
  DeciderSpecification,
  IllegalStateError,
} from '@event-driven-io/emmett';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import type { Cost } from '../../shared/domain/valueobjects/resources';
import type { DwellingEvent } from '../events';
import { decide, evolve, initialState } from './recruit-creature.slice';

const given = DeciderSpecification.for({
  decide,
  evolve,
  initialState,
});

void describe('Slice: Recruit Creature', () => {
  const now = new Date();
  const gameId = randomUUID();
  const dwellingId = randomUUID();
  const armyId = randomUUID();
  const creatureId = 'angel';
  const anotherCreatureId = 'black-dragon';

  const costPerTroop: Cost = {
    gold: 3000,
    wood: 0,
    ore: 0,
    mercury: 0,
    sulfur: 0,
    crystal: 0,
    gems: 1,
  };

  const recruitCreature = (quantity: number, expectedCost?: Cost) => ({
    type: 'RecruitCreature' as const,
    data: {
      dwellingId,
      creatureId,
      armyId,
      quantity,
      expectedCost: expectedCost ?? multiplyCost(costPerTroop, quantity),
    },
    metadata: { gameId, now },
  });

  const recruitAnotherCreature = (quantity: number) => ({
    type: 'RecruitCreature' as const,
    data: {
      dwellingId,
      creatureId: anotherCreatureId,
      armyId,
      quantity,
      expectedCost: multiplyCost(costPerTroop, quantity),
    },
    metadata: { gameId, now },
  });

  const multiplyCost = (cost: Cost, multiplier: number): Cost => ({
    gold: (cost.gold ?? 0) * multiplier,
    wood: (cost.wood ?? 0) * multiplier,
    ore: (cost.ore ?? 0) * multiplier,
    mercury: (cost.mercury ?? 0) * multiplier,
    sulfur: (cost.sulfur ?? 0) * multiplier,
    crystal: (cost.crystal ?? 0) * multiplier,
    gems: (cost.gems ?? 0) * multiplier,
  });

  void describe('given not built dwelling', () => {
    const events: DwellingEvent[] = [];

    void it('when recruit creature, then exception', () =>
      given(events)
        .when(recruitCreature(1))
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message ===
            'Recruit creatures cannot exceed available creatures',
        ));
  });

  void describe('given built but empty dwelling', () => {
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

    void it('when recruit creature, then exception', () =>
      given(events)
        .when(recruitCreature(1))
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message ===
            'Recruit creatures cannot exceed available creatures',
        ));
  });

  void describe('given dwelling with 1 creature', () => {
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

    void it('when recruit 1 creature, then recruited', () =>
      given(events)
        .when(recruitCreature(1))
        .then([
          {
            type: 'CreatureRecruited',
            data: {
              dwellingId,
              creatureId,
              toArmy: armyId,
              quantity: 1,
              totalCost: costPerTroop,
            },
          },
          {
            type: 'AvailableCreaturesChanged',
            data: {
              dwellingId,
              creatureId,
              changedBy: -1,
              changedTo: 0,
            },
          },
        ]));
  });

  void describe('given dwelling with 2 creatures', () => {
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
          changedBy: 2,
          changedTo: 2,
        },
      },
    ];

    void it('when recruit 2 creatures, then recruited', () =>
      given(events)
        .when(recruitCreature(2))
        .then([
          {
            type: 'CreatureRecruited',
            data: {
              dwellingId,
              creatureId,
              toArmy: armyId,
              quantity: 2,
              totalCost: multiplyCost(costPerTroop, 2),
            },
          },
          {
            type: 'AvailableCreaturesChanged',
            data: {
              dwellingId,
              creatureId,
              changedBy: -2,
              changedTo: 0,
            },
          },
        ]));
  });

  void describe('given dwelling with 4 creatures', () => {
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
          changedBy: 3,
          changedTo: 3,
        },
      },
      {
        type: 'AvailableCreaturesChanged',
        data: {
          dwellingId,
          creatureId,
          changedBy: 1,
          changedTo: 4,
        },
      },
    ];

    void it('when recruit 3 creatures, then recruited', () =>
      given(events)
        .when(recruitCreature(3))
        .then([
          {
            type: 'CreatureRecruited',
            data: {
              dwellingId,
              creatureId,
              toArmy: armyId,
              quantity: 3,
              totalCost: multiplyCost(costPerTroop, 3),
            },
          },
          {
            type: 'AvailableCreaturesChanged',
            data: {
              dwellingId,
              creatureId,
              changedBy: -3,
              changedTo: 1,
            },
          },
        ]));
  });

  void describe('given dwelling with 5 creatures', () => {
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
          changedBy: 5,
          changedTo: 5,
        },
      },
    ];

    void it('when recruit 6 creatures, then exception', () =>
      given(events)
        .when(recruitCreature(6))
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message ===
            'Recruit creatures cannot exceed available creatures',
        ));
  });

  void describe('given dwelling with 1 creature', () => {
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

    void it('when recruit creature not from this dwelling, then exception', () =>
      given(events)
        .when(recruitAnotherCreature(1))
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message ===
            'Recruit creatures cannot exceed available creatures',
        ));
  });

  void describe('given dwelling with recruited all available creatures', () => {
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
          changedBy: 3,
          changedTo: 3,
        },
      },
      {
        type: 'CreatureRecruited',
        data: {
          dwellingId,
          creatureId,
          toArmy: armyId,
          quantity: 2,
          totalCost: multiplyCost(costPerTroop, 2),
        },
      },
      {
        type: 'AvailableCreaturesChanged',
        data: {
          dwellingId,
          creatureId,
          changedBy: -2,
          changedTo: 1,
        },
      },
      {
        type: 'AvailableCreaturesChanged',
        data: {
          dwellingId,
          creatureId,
          changedBy: 3,
          changedTo: 4,
        },
      },
      {
        type: 'CreatureRecruited',
        data: {
          dwellingId,
          creatureId,
          toArmy: armyId,
          quantity: 4,
          totalCost: multiplyCost(costPerTroop, 4),
        },
      },
      {
        type: 'AvailableCreaturesChanged',
        data: {
          dwellingId,
          creatureId,
          changedBy: -4,
          changedTo: 0,
        },
      },
    ];

    void it('when recruit creature, then exception', () =>
      given(events)
        .when(recruitCreature(3))
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message ===
            'Recruit creatures cannot exceed available creatures',
        ));
  });

  void describe('given dwelling with recruited some creatures and 1 left', () => {
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
          changedBy: 4,
          changedTo: 4,
        },
      },
      {
        type: 'CreatureRecruited',
        data: {
          dwellingId,
          creatureId,
          toArmy: armyId,
          quantity: 3,
          totalCost: multiplyCost(costPerTroop, 3),
        },
      },
      {
        type: 'AvailableCreaturesChanged',
        data: {
          dwellingId,
          creatureId,
          changedBy: -3,
          changedTo: 1,
        },
      },
    ];

    void it('when recruit 1 creature, then recruited', () =>
      given(events)
        .when(recruitCreature(1))
        .then([
          {
            type: 'CreatureRecruited',
            data: {
              dwellingId,
              creatureId,
              toArmy: armyId,
              quantity: 1,
              totalCost: costPerTroop,
            },
          },
          {
            type: 'AvailableCreaturesChanged',
            data: {
              dwellingId,
              creatureId,
              changedBy: -1,
              changedTo: 0,
            },
          },
        ]));
  });

  void describe('given dwelling with 1 creature', () => {
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

    void it('when expected cost does not match actual cost, then exception', () => {
      const wrongExpectedCost: Cost = {
        gold: 999999,
        wood: 0,
        ore: 0,
        mercury: 0,
        sulfur: 0,
        crystal: 0,
        gems: 0,
      };

      return given(events)
        .when(recruitCreature(1, wrongExpectedCost))
        .thenThrows<IllegalStateError>(
          (error) =>
            error.message === 'Recruit cost cannot differ than expected cost',
        );
    });
  });
});
