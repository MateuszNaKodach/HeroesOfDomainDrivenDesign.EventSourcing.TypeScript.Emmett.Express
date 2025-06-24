import { type Event } from '@event-driven-io/emmett';

export type DwellingBuilt = Event<
  'DwellingBuilt',
  {
    dwellingId: string;
    creatureId: string;
    costPerTroop: Record<string, number>;
  }
>;
