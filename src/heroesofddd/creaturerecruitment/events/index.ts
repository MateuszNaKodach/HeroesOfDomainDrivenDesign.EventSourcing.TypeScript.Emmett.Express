import type { DwellingBuilt } from './dwelling-built.event';
import type { CreatureRecruited } from './creature-recruited.event';
import type { AvailableCreaturesChanged } from './available-creatures-changed.event';

export type DwellingEvent =
  | DwellingBuilt
  | CreatureRecruited
  | AvailableCreaturesChanged;
