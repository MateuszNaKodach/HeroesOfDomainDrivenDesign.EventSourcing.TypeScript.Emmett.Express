import { type Event } from '@event-driven-io/emmett';
import { type ResourceType } from '../../shared/domain/valueobjects/resourceType';

export type DwellingBuilt = Event<
  'DwellingBuilt',
  {
    dwellingId: string;
    creatureId: string;
    costPerTroop: Record<ResourceType, number>;
  }
>;
