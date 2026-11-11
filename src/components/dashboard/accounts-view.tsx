"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { AccountFormModal } from "@/components/dashboard/account-form-modal";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  EASE,
  WIDGET_CARD_CLASS,
  staggerDelay,
} from "@/components/dashboard/motion";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageShell } from "@/components/dashboard/page-shell";
import { Snackbar } from "@/components/dashboard/snackbar";
import { TransferFormModal } from "@/components/dashboard/transfer-form-modal";
import { useAccounts } from "@/components/use-accounts";
import { useIsClient } from "@/components/use-is-client";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { useTransfers } from "@/components/use-transfers";
import { accountKindLabel } from "@/lib/finance/account-form";
import { accountBalances } from "@/lib/finance/accounts";
import { useCurrency } from "@/components/currency-provider";
import { formatDateLabel } from "@/lib/finance/format";
import { isoDate } from "@/lib/finance/period";
import {
  applyTransfersToBalances,
  buildTransferRows,
} from "@/lib/finance/transfer";
import { deleteAccount } from "@/lib/supabase/accounts";
import { saveTransfers } from "@/lib/storage/transfers";
import type { Account, AccountKind } from "@/types/account";
import type { NewTransfer } from "@/types/transfer";

const SKELETON_CARDS = 3;
const NOTICE_DURATION_MS = 5_000;
const RECENT_TRANSFERS = 6;

const KIND_ICONS: Record<AccountKind, LucideIcon> = {
  checking: Landmark,
  savings: Banknote,
  cash: Wallet,
  credit: CreditCard,
};

interface Notice {
  message: string;
  tone: "neutral" | "danger";
}

function newTransferId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function Skeleton({ className }: { className: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.85, 0.4] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: EASE }
      }
      className={`block rounded-full bg-surface-subtle ${className}`}
    />
  );
}

function AccountsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading accounts"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className={WIDGET_CARD_CLASS}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-5 h-6 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function AccountsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={`${WIDGET_CARD_CLASS} flex flex-col items-start gap-4`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger-light text-danger">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">
            Could not load your accounts
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function AccountCard({
  account,
  balance,
  index,
  onEdit,
  onDelete,
}: {
  account: Account;
  balance: number;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const { format } = useCurrency();
  const Icon = KIND_ICONS[account.kind] ?? Wallet;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: staggerDelay(index),
        ease: EASE,
      }}
      whileHover={reduced ? undefined : { y: -3 }}
      className={WIDGET_CARD_CLASS}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            style={{ backgroundColor: `${account.color}22`, color: account.color }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text">
              {account.name}
            </h3>
            <p className="text-xs text-text-muted">
              {accountKindLabel(account.kind)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${account.name}`}
            title="Edit account"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${account.name}`}
            title="Delete account"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      <p
        className={`mt-5 text-2xl font-semibold tracking-tight tabular-nums ${
          balance < 0 ? "text-danger" : "text-text"
        }`}
      >
        {format(balance)}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        Opening {format(account.openingBalance)}
      </p>
    </motion.div>
  );
}

export function AccountsView() {
  const { status, accounts, error, reload } = useAccounts();
  const { user } = useSession();
  const userId = user?.id ?? null;
  const isClient = useIsClient();
  const reduced = usePrefersReducedMotion();
  const { format } = useCurrency();
  const transfers = useTransfers(userId);
  const referenceDate = useMemo(() => isoDate(new Date()), []);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const balances = useMemo(() => {
    if (accounts === null) return null;
    return applyTransfersToBalances(accountBalances(accounts), transfers);
  }, [accounts, transfers]);

  const transferRows = useMemo(
    () => (accounts ? buildTransferRows(transfers, accounts) : []),
    [transfers, accounts],
  );

  const totalBalance = useMemo(
    () => (balances ? balances.reduce((sum, row) => sum + row.balance, 0) : 0),
    [balances],
  );

  const ready = isClient && status === "ready" && balances !== null;
  const accountList = accounts ?? [];
  const canTransfer = ready && accountList.length >= 2;

  function handleSaved(account: Account) {
    setAdding(false);
    setEditing(null);
    setNotice({ message: `Saved ${account.name}.`, tone: "neutral" });
    reload();
  }

  function handleTransferSaved(input: NewTransfer) {
    saveTransfers(userId, [
      ...transfers,
      { ...input, id: newTransferId() },
    ]);
    setTransferring(false);
    setNotice({
      message: `Transferred ${format(input.amount)}.`,
      tone: "neutral",
    });
  }

  function handleDeleteTransfer(id: string) {
    saveTransfers(
      userId,
      transfers.filter((transfer) => transfer.id !== id),
    );
    setNotice({ message: "Transfer removed.", tone: "neutral" });
  }

  async function handleConfirmDelete() {
    if (deleting === null) return;

    setDeleteBusy(true);
    const { error: deleteErr } = await deleteAccount(deleting.id);
    setDeleteBusy(false);

    if (deleteErr) {
      setDeleteError(deleteErr.message);
      return;
    }

    saveTransfers(
      userId,
      transfers.filter(
        (transfer) =>
          transfer.fromAccountId !== deleting.id &&
          transfer.toAccountId !== deleting.id,
      ),
    );
    setDeleteError(null);
    setNotice({ message: `Deleted ${deleting.name}.`, tone: "neutral" });
    setDeleting(null);
    reload();
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="Wallets"
          title="Accounts"
          description="See where your money lives and move funds between your accounts."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTransferring(true)}
                disabled={!canTransfer}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-medium text-text transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Transfer
              </button>
              <button
                type="button"
                onClick={() => setAdding(true)}
                disabled={status !== "ready"}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
              >
                <Plus className="h-4 w-4" />
                New account
              </button>
            </div>
          }
        />

        <AnimatePresence mode="wait">
          {status === "error" ? (
            <motion.div
              key="error"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <AccountsError
                message={
                  error?.message ??
                  "Something went wrong while loading your accounts."
                }
                onRetry={reload}
              />
            </motion.div>
          ) : !ready ? (
            <motion.div
              key="loading"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <AccountsSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col gap-8"
            >
              {accountList.length === 0 ? (
                <div className={`${WIDGET_CARD_CLASS} text-center`}>
                  <p className="text-sm font-medium text-text">
                    No accounts yet
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Add a checking account, savings pot or cash wallet to start.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                        <Wallet className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                          Total balance
                        </p>
                        <p className="text-xl font-semibold tabular-nums text-text">
                          {format(totalBalance)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {accountList.length}{" "}
                      {accountList.length === 1 ? "account" : "accounts"}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accountList.map((account, index) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        balance={
                          balances.find(
                            (row) => row.accountId === account.id,
                          )?.balance ?? account.openingBalance
                        }
                        index={index}
                        onEdit={() => setEditing(account)}
                        onDelete={() => {
                          setDeleteError(null);
                          setDeleting(account);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              <section aria-labelledby="recent-transfers-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2
                    id="recent-transfers-heading"
                    className="text-sm font-semibold text-text"
                  >
                    Recent transfers
                  </h2>
                  {transferRows.length > 0 && (
                    <span className="text-xs text-text-muted">
                      {transferRows.length}{" "}
                      {transferRows.length === 1 ? "transfer" : "transfers"}
                    </span>
                  )}
                </div>

                {transferRows.length === 0 ? (
                  <div className={`${WIDGET_CARD_CLASS} text-sm text-text-muted`}>
                    {accountList.length >= 2
                      ? "No transfers yet. Move money between your accounts to see it here."
                      : "Add at least two accounts to transfer money between them."}
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {transferRows
                      .slice(0, RECENT_TRANSFERS)
                      .map((transfer) => (
                        <motion.li
                          key={transfer.id}
                          layout={!reduced}
                          initial={reduced ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduced ? undefined : { opacity: 0, y: -6 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
                            <ArrowLeftRight className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-text">
                              {transfer.note}
                            </p>
                            <p className="truncate text-xs text-text-muted">
                              {transfer.fromName} → {transfer.toName} ·{" "}
                              {formatDateLabel(
                                transfer.occurredOn,
                                referenceDate,
                              )}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums text-text">
                            {format(transfer.amount)}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransfer(transfer.id)}
                            aria-label={`Delete transfer ${transfer.note}`}
                            title="Delete transfer"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.li>
                      ))}
                  </ul>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <AccountFormModal
            onClose={() => setAdding(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing !== null && (
          <AccountFormModal
            key={editing.id}
            account={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transferring && accounts !== null && (
          <TransferFormModal
            accounts={accounts}
            referenceDate={referenceDate}
            onClose={() => setTransferring(false)}
            onSaved={handleTransferSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting !== null && (
          <ConfirmDialog
            title="Delete this account?"
            description={`“${deleting.name}” will be removed. Transfers involving it will be cleared from this device.`}
            confirmLabel="Delete account"
            cancelLabel="Keep it"
            tone="danger"
            busy={deleteBusy}
            busyLabel="Deleting…"
            error={deleteError}
            onConfirm={() => {
              void handleConfirmDelete();
            }}
            onCancel={() => {
              setDeleting(null);
              setDeleteError(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice !== null && (
          <Snackbar
            key={notice.message}
            message={notice.message}
            tone={notice.tone}
            duration={NOTICE_DURATION_MS}
            onDismiss={() => setNotice(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
