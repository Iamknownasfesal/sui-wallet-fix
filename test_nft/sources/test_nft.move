module test_nft::test_nft {
    use sui::tx_context::sender;
    use sui::package;
    use sui::transfer_policy as policy;
    use test_nft::royalty_rule::{add as royalty_rule_add};
    use test_nft::kiosk_lock_rule::{add as kiosk_lock_rule_add};
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{TransferPolicy, TransferRequest};

    public struct TEST_NFT has drop {}
    public struct NFT has key, store {
        id: UID,
    }

    public struct Vault has key, store {
        id: UID,
        kiosk_cap: KioskOwnerCap,
        kiosk_id: ID,
    }

    // === Constants ===

    const BP: u16 = 600;
    const MIN_AMOUNT: u64 = 0;

    #[allow(lint(share_owned))]
    fun init(otw: TEST_NFT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        let (mut policy, policy_cap) = policy::new<NFT>(&publisher, ctx);
        royalty_rule_add(&mut policy, &policy_cap, BP, MIN_AMOUNT);
        kiosk_lock_rule_add(&mut policy, &policy_cap);

        transfer::public_share_object(policy);
        transfer::public_transfer(publisher, sender(ctx));
        transfer::public_transfer(policy_cap, sender(ctx));
        let (kiosk, owner_cap) = kiosk::new(ctx);
        let kiosk_id = object::id(&kiosk);

        let vault = Vault { id: object::new(ctx), kiosk_cap: owner_cap, kiosk_id };
        transfer::public_share_object(vault);
        transfer::public_share_object(kiosk);
    }

    public fun new(ctx: &mut TxContext): NFT {
        NFT { id: object::new(ctx) }
    }

    public fun deposit_to_vault(
        vault: &Vault,
        policy: &TransferPolicy<NFT>,
        vault_kiosk: &mut Kiosk,
        nft_id: ID,
        nft_kiosk: &mut Kiosk,
        nft_kiosk_cap: &KioskOwnerCap,
        ctx: &mut TxContext,
    ): TransferRequest<NFT> {
        nft_kiosk.list<NFT>(nft_kiosk_cap, nft_id, 0);
        let coin = sui::coin::zero<0x2::sui::SUI>(ctx);
        let (nft, request) = nft_kiosk.purchase<NFT>(nft_id, coin);

        vault_kiosk.lock(&vault.kiosk_cap, policy, nft);
        request
    }

    public fun withdraw_from_vault(
        vault: &Vault,
        vault_kiosk: &mut Kiosk,
        nft_id: ID,
        ctx: &mut TxContext,
    ): (NFT, TransferRequest<NFT>) {
        vault_kiosk.list<NFT>(&vault.kiosk_cap, nft_id, 0);
        let coin = sui::coin::zero<0x2::sui::SUI>(ctx);
        let (nft, request) = vault_kiosk.purchase<NFT>(nft_id, coin);

        (nft, request)
    }

    public fun burn(nft: NFT) {
        let NFT { id } = nft;
        object::delete(id);
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(TEST_NFT {}, ctx);
    }
}
