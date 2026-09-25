// Fields that older code still reads but that are NOT defined in the current
// Mongoose schemas. On documents loaded through Mongoose they are always
// undefined (raw legacy records may still carry them). They are typed here so
// the TypeScript conversion keeps that existing behaviour visible and
// unchanged; sites where it causes a real problem are marked `BUG:`.

export interface LegacyUserFields {
  /** Replaced by `schoolId` / `schoolName`. */
  school?: string;
  /** Never part of the User schema; roles are used instead. */
  isAdmin?: boolean;
  /** Users have `firstName` / `lastName`, not `name`. */
  name?: string;
}

export interface LegacySchoolFields {
  /** Schools store their logo in `logo`. */
  schoolLogo?: string;
}

export interface LegacyClassFields {
  /** Replaced by `classTeacher`. */
  teacher?: { toString(): string } | null;
}

/** Reads fields that are not part of a document's current schema. */
export const legacy = <T>(doc: unknown): T => doc as T;
