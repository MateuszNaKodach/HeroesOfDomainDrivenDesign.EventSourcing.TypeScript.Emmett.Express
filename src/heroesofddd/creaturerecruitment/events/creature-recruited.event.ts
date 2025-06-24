import { type Event } from '@event-driven-io/emmett';
import { type Cost } from '../../shared/domain/valueobjects/resources';

export type CreatureRecruited = Event<
  'CreatureRecruited',
  {
    dwellingId: string;
    creatureId: string;
    toArmy: string;
    quantity: number;
    totalCost: Cost;
  }
>;
