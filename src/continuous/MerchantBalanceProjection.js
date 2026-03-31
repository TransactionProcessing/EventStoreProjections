//starttestsetup
var fromAll = fromAll || require("../../node_modules/event-store-projection-testing-framework").scope.fromAll;
var partitionBy = partitionBy !== null ? partitionBy : require('../node_modules/event-store-projection-testing').scope.partitionBy;
var linkTo = linkTo || require("../../node_modules/event-store-projection-testing-framework").scope.linkTo;
//endtestsetup

// ------------------------
// Helpers
// ------------------------

function createMetric(lastField) {
    return {
        count: 0,
        value: 0,
        [lastField]: null
    };
}

function updateLastDate(metric, field, newDate) {
    if (!metric[field] || newDate > metric[field]) {
        metric[field] = newDate;
    }
}

function isEventValid(e) {
    if (!e || !e.data) return false;                    // No event data
    if (!e.data.merchantId) return false;               // No merchant
    if (!e.data.estateId) return false;                // No estate
    if (typeof e.eventType !== 'string') return false; // Must have eventType
    if (e.eventType.startsWith('$')) return false;     // Ignore system events
    return true;
}

function applyMetric(metric, amount, dateField, dateValue) {
    metric.count++;
    metric.value += amount;
    updateLastDate(metric, dateField, dateValue);
}

function withMerchant(s, e, handler) {
    if (!s.merchant) return;

    const position = e.position && e.position.commitPosition;

    // Idempotency guard (based on $all ordering)
    if (
        s.merchant.lastProcessedPosition !== null &&
        position !== undefined &&
        position <= s.merchant.lastProcessedPosition
    ) {
        return;
    }

    // Update position + debug info
    if (position !== undefined) {
        s.merchant.lastProcessedPosition = position;
    }

    s.merchant.lastProcessedEventId = e.eventId;
    s.merchant.lastProcessedEventType = e.eventType;

    s.merchant.numberOfEventsProcessed++;

    handler(s.merchant);
}

// ------------------------
// State Factory
// ------------------------

function createMerchant(id, name) {
    return {
        Id: id,
        Name: name,
        numberOfEventsProcessed: 1,
        balance: 0,

        // Idempotency + debugging
        lastProcessedPosition: null,
        lastProcessedEventId: null,
        lastProcessedEventType: null,

        // Metrics
        deposits: createMetric("lastDeposit"),
        withdrawals: createMetric("lastWithdrawal"),
        authorisedSales: createMetric("lastSale"),
        declinedSales: createMetric("lastSale"),
        fees: createMetric("lastFee")
    };
}

// ------------------------
// Declarative Event Config
// ------------------------

const eventConfig = {
    ManualDepositMadeEvent: {
        amount: e => e.data.amount,
        balanceDelta: e => e.data.amount,
        metric: "deposits",
        dateField: "lastDeposit",
        date: e => e.data.depositDateTime
    },

    AutomaticDepositMadeEvent: {
        amount: e => e.data.amount,
        balanceDelta: e => e.data.amount,
        metric: "deposits",
        dateField: "lastDeposit",
        date: e => e.data.depositDateTime
    },

    WithdrawalMadeEvent: {
        amount: e => e.data.amount,
        balanceDelta: e => -e.data.amount,
        metric: "withdrawals",
        dateField: "lastWithdrawal",
        date: e => e.data.withdrawalDateTime
    },

    SettledMerchantFeeAddedToTransactionEvent: {
        amount: e => e.data.calculatedValue,
        balanceDelta: e => e.data.calculatedValue,
        metric: "fees",
        dateField: "lastFee",
        date: e => e.data.feeCalculatedDateTime
    },

    TransactionHasBeenCompletedEvent: {
        when: e => e.data.transactionAmount !== undefined,

        variants: [
            {
                when: e => e.data.isAuthorised === true,
                amount: e => e.data.transactionAmount,
                balanceDelta: e => -e.data.transactionAmount,
                metric: "authorisedSales",
                dateField: "lastSale",
                date: e => e.data.completedDateTime
            },
            {
                when: e => e.data.isAuthorised === false,
                amount: e => e.data.transactionAmount,
                balanceDelta: () => 0,
                metric: "declinedSales",
                dateField: "lastSale",
                date: e => e.data.completedDateTime
            }
        ]
    }
};

// ------------------------
// Generic Handler Engine
// ------------------------

function applyEventConfig(m, e, config) {
    if (config.when && !config.when(e)) return;

    // Handle branching (variants)
    if (config.variants) {
        const variant = config.variants.find(v => v.when(e));
        if (!variant) return;
        
        return applyEventConfig(m, e, variant);
    }

    const amount = config.amount ? config.amount(e) : 0;
    const balanceDelta = config.balanceDelta ? config.balanceDelta(e) : 0;

    if (balanceDelta) {
        m.balance += balanceDelta;
    }

    if (config.metric) {
        applyMetric(
            m[config.metric],
            amount,
            config.dateField,
            config.date(e)
        );
    }
}

function handleConfiguredEvent(eventType) {
    return function (s, e) {
        const config = eventConfig[eventType];
        if (!config) return;

        withMerchant(s, e, m => {
            applyEventConfig(m, e, config);
        });
    };
}

// ------------------------
// Special Case Handler
// ------------------------

function handleMerchantCreated(s, e) {
    if (!s.merchant) {
        s.merchant = createMerchant(
            e.data.merchantId,
            e.data.merchantName
        );
    }
}

function handleConfiguredEventSafe(eventType) {
                    
    const handler = handleConfiguredEvent(eventType);  // get the original handler
    return (state, e) => {     
        if (!isEventValid(e)) return;                   // skip invalid events  
        handler(state, e);                              // call original handler
    };
}

// ------------------------
// Projection Definition
// ------------------------

fromAll()
    .partitionBy(e =>
        "MerchantBalance-" + e.data.merchantId.replace(/-/gi, "")
    )
    .when({
        $init: () => ({ merchant: null }),

        MerchantCreatedEvent: handleMerchantCreated,

        ManualDepositMadeEvent: handleConfiguredEventSafe("ManualDepositMadeEvent"),
        AutomaticDepositMadeEvent: handleConfiguredEventSafe("AutomaticDepositMadeEvent"),

        WithdrawalMadeEvent: handleConfiguredEventSafe("WithdrawalMadeEvent"),

        TransactionHasBeenCompletedEvent: handleConfiguredEventSafe("TransactionHasBeenCompletedEvent"),

        SettledMerchantFeeAddedToTransactionEvent: handleConfiguredEventSafe("SettledMerchantFeeAddedToTransactionEvent")
    });