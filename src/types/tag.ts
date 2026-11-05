/** A free-form label that can be attached to transactions. */
export interface Tag {
  id: string;
  name: string;
  /** Hex accent colour used for the tag. */
  color: string;
}

/** Shape accepted when creating a tag (`id` is assigned by the database). */
export type NewTag = Omit<Tag, "id">;
