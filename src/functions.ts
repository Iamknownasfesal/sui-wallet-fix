import invariant from "ts-invariant";
import { KIOSK_CLIENT } from "./clients";
import { Transaction } from "@mysten/sui/transactions";
import { KioskTransaction } from "@mysten/kiosk";
import { MODULE, NFT_TYPE, POLICY, VAULT, VAULT_KIOSK } from "./objects";

export async function mint(address: string): Promise<Transaction> {
  const tx = new Transaction();
  let cap = await getCap(address);
  const kioskTransaction = new KioskTransaction({
    kioskClient: KIOSK_CLIENT,
    transaction: tx,
    cap,
  });

  if (!cap) {
    kioskTransaction.create();
  }

  const nft = tx.moveCall({
    target: `${MODULE}::test_nft::new`,
  });

  kioskTransaction.lock({
    item: nft,
    itemType: NFT_TYPE,
    policy: tx.object(POLICY),
  });

  if (!cap) {
    kioskTransaction.shareAndTransferCap(address);
  }

  kioskTransaction.finalize();

  return tx;
}

export async function stake(
  nft: string,
  kiosk: string,
  kioskCap: string
): Promise<Transaction> {
  const tx = new Transaction();

  const request = tx.moveCall({
    target: `${MODULE}::test_nft::deposit_to_vault`,
    arguments: [
      tx.object(VAULT),
      tx.object(POLICY),
      tx.object(VAULT_KIOSK),
      tx.object(nft),
      tx.object(kiosk),
      tx.object(kioskCap),
    ],
  });

  tx.moveCall({
    target: `${MODULE}::royalty_rule::pay`,
    arguments: [
      tx.object(POLICY),
      request,
      tx.splitCoins(tx.gas, [
        tx.moveCall({
          target: `${MODULE}::royalty_rule::fee_amount`,
          arguments: [tx.object(POLICY), tx.pure.u64(0)],
          typeArguments: [NFT_TYPE],
        }),
      ]),
    ],
    typeArguments: [NFT_TYPE],
  });

  tx.moveCall({
    target: `${MODULE}::kiosk_lock_rule::prove`,
    arguments: [request, tx.object(VAULT_KIOSK)],
    typeArguments: [NFT_TYPE],
  });

  tx.moveCall({
    target: `0x2::transfer_policy::confirm_request`,
    arguments: [tx.object(POLICY), request],
    typeArguments: [NFT_TYPE],
  });

  return tx;
}

export async function withdraw(
  address: string,
  nft: string
): Promise<Transaction> {
  const tx = new Transaction();
  let cap = await getCap(address);
  const kioskTransaction = new KioskTransaction({
    kioskClient: KIOSK_CLIENT,
    transaction: tx,
    cap,
  });

  if (!cap) {
    kioskTransaction.create();
  }

  const [nftItem, request] = tx.moveCall({
    target: `${MODULE}::test_nft::withdraw_from_vault`,
    arguments: [tx.object(VAULT), tx.object(VAULT_KIOSK), tx.object(nft)],
  });

  tx.moveCall({
    target: `${MODULE}::royalty_rule::pay`,
    arguments: [
      tx.object(POLICY),
      request,
      tx.splitCoins(tx.gas, [
        tx.moveCall({
          target: `${MODULE}::royalty_rule::fee_amount`,
          arguments: [tx.object(POLICY), tx.pure.u64(0)],
          typeArguments: [NFT_TYPE],
        }),
      ]),
    ],
    typeArguments: [NFT_TYPE],
  });

  kioskTransaction.lock({
    item: nftItem,
    itemType: NFT_TYPE,
    policy: tx.object(POLICY),
  });

  tx.moveCall({
    target: `${MODULE}::kiosk_lock_rule::prove`,
    arguments: [request, tx.object(VAULT_KIOSK)],
    typeArguments: [NFT_TYPE],
  });

  tx.moveCall({
    target: `0x2::transfer_policy::confirm_request`,
    arguments: [tx.object(POLICY), request],
    typeArguments: [NFT_TYPE],
  });

  if (!cap) {
    kioskTransaction.shareAndTransferCap(address);
  }

  kioskTransaction.finalize();

  return tx;
}

async function getCap(address: string) {
  let { kioskOwnerCaps } = await KIOSK_CLIENT.getOwnedKiosks({
    address,
  });

  // Assume that the user has only 1 kiosk.
  // Here, you need to do some more checks in a realistic scenario.
  // And possibly give the user in our dApp a kiosk selector to choose which one they want to interact with (if they own more than one).
  return kioskOwnerCaps[0];
}
