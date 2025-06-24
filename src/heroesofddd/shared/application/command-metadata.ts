import { type DefaultCommandMetadata } from '@event-driven-io/emmett';

export type CommandMetadata = { gameId: string } & DefaultCommandMetadata;
