import { projections } from '@event-driven-io/emmett';
import { getApplication, startAPI } from '@event-driven-io/emmett-expressjs';
import { getPostgreSQLEventStore } from '@event-driven-io/emmett-postgresql';
import { pongoClient } from '@event-driven-io/pongo';
import { randomUUID } from 'crypto';
import type { Application } from 'express';
import { guestStayAccountsApi } from './guestStayAccounts/api/api';
import { guestStayDetailsProjection } from './guestStayAccounts/guestStayDetails';
import { buildDwellingEndpoint } from './heroesofddd/creaturerecruitment/write/build-dwelling.slice';
import { increaseAvailableCreaturesEndpoint } from './heroesofddd/creaturerecruitment/write/increase-available-creatures.slice';

const connectionString =
  process.env.POSTGRESQL_CONNECTION_STRING ??
  'postgresql://postgres@localhost:5432/postgres';

const eventStore = getPostgreSQLEventStore(connectionString, {
  projections: projections.inline([guestStayDetailsProjection]),
});

const readStore = pongoClient(connectionString);

const doesGuestStayExist = (_guestId: string, _roomId: string, _day: Date) =>
  Promise.resolve(true);

const currentTime = () => new Date();
const guestStayAccounts = guestStayAccountsApi(
  eventStore,
  readStore.db(),
  doesGuestStayExist,
  (prefix) => `${prefix}-${randomUUID()}`,
  currentTime,
);

const buildDwellingSlice = buildDwellingEndpoint(eventStore, currentTime);
const increaseAvailableCreaturesSlice = increaseAvailableCreaturesEndpoint(
  eventStore,
  currentTime,
);

const application: Application = getApplication({
  apis: [
    guestStayAccounts,
    buildDwellingSlice,
    increaseAvailableCreaturesSlice,
  ],
});

startAPI(application);
