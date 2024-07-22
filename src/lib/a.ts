import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, fromB64 } from "@mysten/sui/utils";
import { uint8ArrayToBCS } from "@wormhole-foundation/sdk-sui";

const VAA =
  "AQAAAAQNAC1zqFEhcPXC/niX3rkI0u7qMqUne36ZN04dVSSqKksMFEVVxCZjBlrq+RUdRk4yaEkanZ0b9P0t05lxoVYnPqEBASLMXbSsVkRze9bpRutohOj4UlSC2EhAf4Toa45wL9PMWtMNbISvMEDin8QnAUj20SIHIwKUW3d/3yZZWhI6VncAAomT0REerHiisP6tLbbRscIr9jb4J3O8udiC0tpa0KueBHlgY4A1fjuZdjGpE2EP0fCqvjOJAC4u1XPtgeGgU70BBKKEXMunF2i/1QtrPZIBblBwZxelqeZsZgw6Hl+Q8W6ObJI9dhPVho4VTpJFPfO0Jth/nO3N6APVLMWU7nMd3vkBBtXPEUCZhZr0NS2Ia+cbErDhQVzEPXX7rLa0PNV9QekFR0YXIZe9RjwjA+CX1XuMkkt2qG34Pv8XhqxqmDfbk18BCCNObkeQLPG+sKWjTM2qvc6RdNs17KwLYwNpHHSWPJ9kOtDyYohyySbEoncDW8ZcUhbTlQ+CuS+nAeEW8I5KWEsACYujIzLiGMeSEf4cJtjAMGDbMBNNQfgiqA7kcBZLpoJCM5c4yUkZ1sRZuIrJMZY1lgRcgaLfD5sDI+AOoHGVecEBCoI2p7jRuBtSAcOMhvweJKkGHwhiEmQ8c0gs3u9NbYkpI1Ul4VZWOdIvTojIOWDp76EfsrQeRMiSoqdQOLtV0BwBDFVTUmmPXlfYaSa6VZbSsyZ3GZNXh6LRIggVbI7RInRFYSFXuuOiJZR9pRSKpZ2FpSYjucl3LzkPblHoKMpZux8ADt36YBYJnl1WjGqNuylPmLhSB79rutXniMnFPF1QAHLIWOVpqHenkAv4D4xge078N0/g0YSLEmXPxhLwTdaQuBEAD+a1o3vBk1b3YIIt0qWa1cYHhxX6mdrvFv3lgQwDWF2tBsyYibrka3wAuSBAVFz93AX/6JLTB6nQ3MXf+FJRzGAAEKskGpI87uk1Rs4cJXXmaWGWzQCvV2E29UItTekXt4JCMCDVvEyNjS+6T5RpAA/o3cEphQEs+NbSSSETw55/t44AEUre4Lpz3f17Th1qyyFyxBsH8wSZva1wxHGdTUxuWvyhIJ0UOq4or3pCpOWeLRjQUEbsnszfNkLpcAcHYUe9wRAAZp3RF2lxAQAAAgAAAAAAAAAAAAAAAD7hiyIUr/lwANl0z2R+fDR+j6WFAAAAAAAEur8BAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAexhCrAAAAAAAAAAAAAAAAAoLhpkcYhizbB0Z1KLp6wzjYG60gAAhMumCIhAbzRh8qlqHwgz7DnCDIVLHgbTFXfUFW4j+xdABUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
const STATE =
  "0xc57508ee0d4595e5a8728974a4a93a787d38f339757230d441e895422c07aba9";

export async function ClaimWormhole() {
  const txb = new Transaction();
  const bytes = fromB64(VAA);

  const VAA0 = txb.moveCall({
    target: `0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a::vaa::parse_and_verify`,
    arguments: [
      txb.object(
        "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c"
      ),
      txb.pure(uint8ArrayToBCS(bytes)),
      txb.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  const VAA1 = txb.moveCall({
    target: `0x26efee2b51c911237888e5dc6702868abca3c7ac12c53f76ef8eba0697695e3d::vaa::verify_only_once`,
    arguments: [txb.object(STATE), VAA0],
  });

  const VAA2 = txb.moveCall({
    target: `0x26efee2b51c911237888e5dc6702868abca3c7ac12c53f76ef8eba0697695e3d::complete_transfer::authorize_transfer`,
    arguments: [txb.object(STATE), VAA1],
    typeArguments: [
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
  });

  const VAA3 = txb.moveCall({
    target: `0x26efee2b51c911237888e5dc6702868abca3c7ac12c53f76ef8eba0697695e3d::complete_transfer::redeem_relayer_payout`,
    arguments: [VAA2],
    typeArguments: [
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
  });

  let coin = txb.moveCall({
    target: `0x26efee2b51c911237888e5dc6702868abca3c7ac12c53f76ef8eba0697695e3d::coin_utils::return_nonzero`,
    arguments: [VAA3],
    typeArguments: [
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
  });

  txb.transferObjects(
    [coin],
    "0x132e98222101bcd187caa5a87c20cfb0e70832152c781b4c55df5055b88fec5d"
  );

  return txb;
}
