import { type Event } from '@event-driven-io/emmett';
import { type ResourceType } from '../../shared/domain/valueobjects/resourceType';

export type CreatureRecruited = Event<
  'CreatureRecruited',
  {
    dwellingId: string;
    creatureId: string;
    toArmy: string;
    quantity: number;
    totalCost: Record<ResourceType, number>;
  }
>;
