import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { useState } from "react";
import { useExecute } from "@/hooks/useExecute";
import { mint, stake } from "@/functions";
import invariant from "ts-invariant";
import { NFT_TYPE } from "@/objects";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconenct } = useDisconnectWallet();
  const { signAndExecute } = useExecute();
  const [error, setError] = useState<string>("Currently None.");
  const [nft, setNFT] = useState<string | null>(null);
  const [kiosk, setKiosk] = useState<string | null>(null);
  const [kioskCap, setKioskCap] = useState<string | null>(null);
  return (
    <main
      className={`flex min-h-screen flex-col items-center text-wrap p-4 ${inter.className}`}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-light">
          <span className="font-bold">Connected Address:</span>{" "}
          {currentAccount?.address}
        </p>
        <p className="text-sm font-light">
          <span className="font-bold">NFT:</span> {nft}
        </p>
        <p className="text-sm font-light">
          <span className="font-bold">Kiosk:</span> {kiosk}
        </p>
        <p className="text-sm font-light">
          <span className="font-bold">KioskOwnerCap:</span> {kioskCap}
        </p>
        {currentAccount ? (
          <>
            <Button
              onClick={() => {
                disconenct();
              }}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <ConnectModal trigger={<Button>Connect</Button>} />
        )}
        <Button
          disabled={!currentAccount}
          onClick={async () => {
            invariant(currentAccount, "Current account is not available.");
            signAndExecute({
              transaction: await mint(currentAccount.address),
            })
              .then((result) => {
                console.log(result);
                setNFT(
                  // @ts-ignore
                  result.objectChanges?.find(
                    (change) =>
                      change.type === "created" && change.objectType == NFT_TYPE
                    // @ts-ignore
                  ).objectId
                );

                setKiosk(
                  // @ts-ignore
                  result.objectChanges?.find(
                    (change) =>
                      (change.type === "created" ||
                        change.type === "mutated") &&
                      change.objectType == "0x2::kiosk::Kiosk"
                    // @ts-ignore
                  ).objectId
                );

                setKioskCap(
                  // @ts-ignore
                  result.objectChanges?.find(
                    (change) =>
                      (change.type === "created" ||
                        change.type === "mutated") &&
                      change.objectType == "0x2::kiosk::KioskOwnerCap"
                    // @ts-ignore
                  ).objectId
                );
              })
              .catch((e) => {
                setError(e.message);
              });
          }}
        >
          Mint NFT
        </Button>
        <Button
          onClick={async () => {
            signAndExecute({
              transaction: await stake(nft!, kiosk!, kioskCap!),
            }).catch((e) => {
              setError(e.message);
            });
          }}
          disabled={!currentAccount || !nft || !kiosk || !kioskCap}
        >
          Reproduce
        </Button>
        <p className="mt-4">
          What i believe is the issue is about using kiosk, spefically about NFT
          getting out.
        </p>
        <p className="mt-6">To reproduce:</p>
        <p className="font-bold">1. Connect your wallet & switch to testnet</p>
        <p className="font-bold">2. Mint an NFT</p>
        <p className="font-bold">
          3. Try to get it out of the kiosk, espically while forcing lock rule.
        </p>
        <p className="mt-6 font-bold">Error</p>
        <p className="font-light">{error}</p>
      </div>
    </main>
  );
}
