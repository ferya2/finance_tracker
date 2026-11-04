import type { Account } from "@/types/account";
import type { Transfer } from "@/types/transfer";

type TransferMovement = Pick<
  Transfer,
  "fromAccountId" | "toAccountId" | "amount"
>;

export interface TransferEffect {
  accountId: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export function transferEffect(
  transfers: readonly TransferMovement[],
  accountId: string,
): TransferEffect {
  let incoming = 0;
  let outgoing = 0;

  for (const transfer of transfers) {
    if (transfer.toAccountId === accountId) {
      incoming += transfer.amount;
    }
    if (transfer.fromAccountId === accountId) {
      outgoing += transfer.amount;
    }
  }

  return {
    accountId,
    incoming,
    outgoing,
    net: incoming - outgoing,
  };
}

export function applyTransfersToBalances<
  T extends { accountId: string; balance: number },
>(balances: readonly T[], transfers: readonly TransferMovement[]): T[] {
  return balances.map((row) => {
    const effect = transferEffect(transfers, row.accountId);
    return effect.net === 0 ? row : { ...row, balance: row.balance + effect.net };
  });
}

export interface TransferRow {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  occurredOn: string;
  fromName: string;
  toName: string;
  fromColor: string;
  toColor: string;
}

export function buildTransferRows(
  transfers: readonly Transfer[],
  accounts: readonly Account[],
): TransferRow[] {
  const byId = new Map(accounts.map((account) => [account.id, account]));

  return transfers
    .map((transfer): TransferRow => {
      const from = byId.get(transfer.fromAccountId);
      const to = byId.get(transfer.toAccountId);

      return {
        id: transfer.id,
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount: transfer.amount,
        note: transfer.note?.trim() || "Transfer",
        occurredOn: transfer.occurredOn,
        fromName: from?.name ?? "Deleted account",
        toName: to?.name ?? "Deleted account",
        fromColor: from?.color ?? "#71717a",
        toColor: to?.color ?? "#71717a",
      };
    })
    .sort(
      (a, b) =>
        b.occurredOn.localeCompare(a.occurredOn) || b.id.localeCompare(a.id),
    );
}
