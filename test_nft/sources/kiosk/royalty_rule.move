module test_nft::royalty_rule {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::transfer_policy::{Self as policy, TransferPolicy, TransferPolicyCap, TransferRequest};

    /// The `amount_bp` passed is more than 100%.
    const EIncorrectArgument: u64 = 0;
    /// The `Coin` used for payment is not enough to cover the fee.
    const EInsufficientAmount: u64 = 1;

    /// Max value for the `amount_bp`.
    const MAX_BPS: u16 = 10_000;

    /// The "Rule" witness to authorize the policy.
    public struct Rule has drop {}

    /// Configuration for the Rule. The `amount_bp` is the percentage
    /// of the transfer amount to be paid as a royalty fee. The `min_amount`
    /// is the minimum amount to be paid if the percentage based fee is
    /// lower than the `min_amount` setting.
    ///
    /// Adding a mininum amount is useful to enforce a fixed fee even if
    /// the transfer amount is very small or 0.
    public struct Config has store, drop {
        amount_bp: u16,
        min_amount: u64,
    }

    /// Creator action: Add the Royalty Rule for the `T`.
    /// Pass in the `TransferPolicy`, `TransferPolicyCap` and the configuration
    /// for the policy: `amount_bp` and `min_amount`.
    public fun add<T: key + store>(
        policy: &mut TransferPolicy<T>,
        cap: &TransferPolicyCap<T>,
        amount_bp: u16,
        min_amount: u64,
    ) {
        assert!(amount_bp <= MAX_BPS, EIncorrectArgument);
        policy::add_rule(Rule {}, policy, cap, Config { amount_bp, min_amount })
    }

    /// Buyer action: Pay the royalty fee for the transfer.
    public fun pay<T: key + store>(
        policy: &mut TransferPolicy<T>,
        request: &mut TransferRequest<T>,
        payment: Coin<SUI>,
    ) {
        let paid = policy::paid(request);
        let amount = fee_amount(policy, paid);

        assert!(coin::value(&payment) == amount, EInsufficientAmount);
        transfer::public_transfer(payment, @0x0);

        policy::add_receipt(Rule {}, request)
    }

    /// Helper function to calculate the amount to be paid for the transfer.
    /// Can be used dry-runned to estimate the fee amount based on the Kiosk listing price.
    public fun fee_amount<T: key + store>(policy: &TransferPolicy<T>, paid: u64): u64 {
        let config: &Config = policy::get_rule(Rule {}, policy);
        let mut amount = (((paid as u128) * (config.amount_bp as u128) / 10_000) as u64);

        // If the amount is less than the minimum, use the minimum
        if (amount < config.min_amount) {
            amount = config.min_amount
        };

        amount
    }
}
