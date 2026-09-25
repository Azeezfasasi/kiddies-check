import mongoose, { type Schema } from "mongoose";

function createModel<TSchema extends Schema>(name: string, schema: TSchema) {
  return mongoose.model(name, schema);
}

/**
 * Registers a Mongoose model once and returns it with types inferred from
 * its schema. Reusing an existing model avoids OverwriteModelError when
 * Next.js reloads modules — the same behaviour as the previous
 * `mongoose.models.X || mongoose.model("X", schema)` pattern.
 */
export function defineModel<TSchema extends Schema>(name: string, schema: TSchema) {
  return (mongoose.models[name] as ReturnType<typeof createModel<TSchema>>) || createModel(name, schema);
}
