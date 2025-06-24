export { type AvailableCreaturesChanged } from './availableCreaturesChanged';
export { type CreatureRecruited } from './creatureRecruited';
export { type DwellingBuilt } from './dwellingBuilt';

export type DwellingEvent =
  | DwellingBuilt
  | CreatureRecruited
  | AvailableCreaturesChanged;
