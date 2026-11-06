"use client";

import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { listTags } from "@/lib/supabase/tags";
import type { Tag } from "@/types/tag";

export type TagsStatus = "loading" | "ready" | "error";

export interface UseTagsResult {
  status: TagsStatus;
  tags: Tag[];
  error: PostgrestError | null;
  reload: () => void;
}

export function useTags(): UseTagsResult {
  const [status, setStatus] = useState<TagsStatus>("loading");
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;

    void listTags().then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setTags([]);
        setStatus("error");
      } else {
        setTags(result.data ?? []);
        setError(null);
        setStatus("ready");
      }
    });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { status, tags, error, reload };
}
