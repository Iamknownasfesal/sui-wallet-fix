import { KioskClient, Network } from "@mysten/kiosk";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export const SUI_CLIENT = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

export const KIOSK_CLIENT = new KioskClient({
  client: SUI_CLIENT,
  network: Network.TESTNET,
});
