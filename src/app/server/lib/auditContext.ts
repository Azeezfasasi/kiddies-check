import { AsyncLocalStorage } from "node:async_hooks";

/** Per-request audit state, shared between withAudit and the ActivityLog model. */
export type AuditStore = { logged: boolean };

export const auditContext = new AsyncLocalStorage<AuditStore>();

/** Called when a route writes its own ActivityLog, so withAudit doesn't add a duplicate. */
export const markActivityLogged = () => {
  const store = auditContext.getStore();
  if (store) store.logged = true;
};
