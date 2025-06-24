import { type Event } from '@event-driven-io/emmett';
import { type Cost } from '../../shared/domain/valueobjects/resources';

export type DwellingBuilt = Event<
  'DwellingBuilt',
  {
    dwellingId: string;
    creatureId: string;
    costPerTroop: Cost;
  }
>;
