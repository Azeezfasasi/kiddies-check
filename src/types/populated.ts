import type { Types } from "mongoose";

// Shapes of documents after `.populate()`, for use with Mongoose's typed
// form: `query.populate<{ parent: PopulatedUser }>("parent", "firstName email")`.
// Fields are optional because each call selects a different subset.

export interface PopulatedUser {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
}

/** A populated school, class or subject (anything with a name). */
export interface PopulatedNamed {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  location?: string;
  level?: string;
  section?: string;
  code?: string;
}

export interface PopulatedStudent {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  enrollmentNo?: string;
  parent?: Types.ObjectId | null;
}
