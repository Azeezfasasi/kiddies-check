/**
 * An object whose shape was never declared in the original JavaScript
 * (form state, lookup maps, request payloads built up field by field).
 *
 * Used during the TypeScript migration so these objects keep working exactly
 * as before. Search for `Loose` to find places worth giving a precise type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Loose = Record<string, any>;
