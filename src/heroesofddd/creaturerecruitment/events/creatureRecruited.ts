import { type Event } from '@event-driven-io/emmett';

export type CreatureRecruited = Event<
  'CreatureRecruited',
  {
    dwellingId: string;
    creatureId: string;
    toArmy: string;
    quantity: number;
    totalCost: Record<string, number>;
  }
>;
