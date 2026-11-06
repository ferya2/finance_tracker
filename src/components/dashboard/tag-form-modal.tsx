"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { EASE } from "@/components/dashboard/motion";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import {
  MAX_TAG_NAME,
  TAG_COLOR_PALETTE,
  emptyTagForm,
  tagToFormValues,
  toNewTag,
  validateTagForm,
  type TagFormValues,
} from "@/lib/finance/tag-form";
import { createTag, updateTag } from "@/lib/supabase/tags";
import type { Tag } from "@/types/tag";

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string };

type FieldName = "name" | "color";

const inputClassName =
  "w-full rounded-xl border border-border bg-surface-muted py-3 px-4 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20";

const errorInputClassName =
  "border-danger focus:border-danger focus:ring-danger/20";

interface TagFormModalProps {
  tag?: Tag;
  onClose: () => void;
  onSaved: (tag: Tag) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function TagFormModal({ tag, onClose, onSaved }: TagFormModalProps) {
  const reduced = usePrefersReducedMotion();
  const isClient = useIsClient();
  const editing = tag !== undefined;
  const id = editing ? "edit-tag" : "add-tag";
  const [values, setValues] = useState<TagFormValues>(() =>
    tag ? tagToFormValues(tag) : emptyTagForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isClient) return;

    nameRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClient, onClose]);

  function update(patch: Partial<TagFormValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    setStatus({ type: "idle" });
    if (started) {
      setFieldErrors(validateTagForm(next));
    }
  }

  function handleBlur() {
    setStarted(true);
    setFieldErrors(validateTagForm(values));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarted(true);

    const errors = validateTagForm(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus({ type: "idle" });
      return;
    }

    setStatus({ type: "loading" });
    const { data, error } = tag
      ? await updateTag(tag.id, toNewTag(values))
      : await createTag(toNewTag(values));

    if (error || !data) {
      setStatus({
        type: "error",
        message: error?.message ?? "Could not save the tag. Try again.",
      });
      return;
    }

    onSaved(data);
  }

  if (!isClient) return null;

  return createPortal(
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/10 sm:rounded-3xl dark:shadow-black/40"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id={`${id}-title`}
                className="text-lg font-semibold tracking-tight text-text"
              >
                {editing ? "Edit tag" : "New tag"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {editing
                  ? "Rename it or give it a fresh colour."
                  : "Name it and pick a colour to spot it quickly."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <motion.span
                key={values.color}
                initial={reduced ? false : { scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                style={{
                  backgroundColor: `${values.color}22`,
                  color: values.color,
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold"
              >
                #
              </motion.span>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`${id}-name`}
                  className="text-sm font-medium text-text"
                >
                  Name
                </label>
                <input
                  id={`${id}-name`}
                  ref={nameRef}
                  value={values.name}
                  onChange={(event) => update({ name: event.target.value })}
                  onBlur={handleBlur}
                  placeholder="Travel, Work, Family…"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? `${id}-name-error` : undefined
                  }
                  className={`mt-1.5 ${inputClassName} ${
                    fieldErrors.name ? errorInputClassName : ""
                  }`}
                />
              </div>
            </div>
            <FieldError id={`${id}-name-error`} message={fieldErrors.name} />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Colour</span>
              <div className="flex flex-wrap gap-2">
                {TAG_COLOR_PALETTE.map((color) => {
                  const selected = values.color === color;
                  return (
                    <motion.button
                      key={color}
                      type="button"
                      onClick={() => update({ color })}
                      aria-label={`Use colour ${color}`}
                      aria-pressed={selected}
                      whileHover={reduced ? undefined : { scale: 1.1 }}
                      whileTap={reduced ? undefined : { scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      style={{ backgroundColor: color }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition-shadow ${
                        selected ? "ring-text" : "ring-transparent"
                      }`}
                    >
                      {selected && <Check className="h-4 w-4 text-white" />}
                    </motion.button>
                  );
                })}
              </div>
              <FieldError id={`${id}-color-error`} message={fieldErrors.color} />
            </div>

            <p className="text-right text-xs text-text-muted tabular-nums">
              {values.name.length}/{MAX_TAG_NAME}
            </p>

            <AnimatePresence initial={false}>
              {status.type === "error" && (
                <motion.p
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-sm text-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {status.message}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={status.type === "loading"}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text disabled:opacity-60"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={status.type === "loading"}
                whileHover={reduced ? undefined : { scale: 1.01 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity disabled:opacity-70"
              >
                {status.type === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Create tag"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
