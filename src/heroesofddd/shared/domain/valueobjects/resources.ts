export type ResourceType =
  | 'gold'
  | 'wood'
  | 'ore'
  | 'mercury'
  | 'sulfur'
  | 'crystal'
  | 'gems';

export type Cost = Record<ResourceType, number | undefined>;
