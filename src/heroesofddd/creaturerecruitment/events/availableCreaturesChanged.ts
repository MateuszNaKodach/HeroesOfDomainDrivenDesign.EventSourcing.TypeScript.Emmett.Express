import { type Event } from '@event-driven-io/emmett';

export type AvailableCreaturesChanged = Event<
  'AvailableCreaturesChanged',
  {
    dwellingId: string;
    creatureId: string;
    changedTo: number;
  }
>;
