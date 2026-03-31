//starttestsetup
var fromAll = fromAll || require("../../node_modules/event-store-projection-testing-framework").scope.fromAll;
var linkTo = linkTo || require("../../node_modules/event-store-projection-testing-framework").scope.linkTo;
//endtestsetup

// -------------------------------
// Event validation
// -------------------------------
function isValidEvent(e) {
    return !!(
        e &&
        e.data &&
        e.isJson &&
        typeof e.eventType === 'string' &&
        !e.eventType.startsWith('$')   // ignore system events
    );
}

// -------------------------------
// Merchant extraction
// -------------------------------
function getMerchantId(e) {
    return e?.data?.merchantId ?? null;
}

// -------------------------------
// Supported events (declarative set)
// -------------------------------
const supportedEvents = new Set([
    "MerchantCreatedEvent",
    "ManualDepositMadeEvent",
    "AutomaticDepositMadeEvent",
    "TransactionHasStartedEvent",
    "TransactionHasBeenCompletedEvent",
    "SettledMerchantFeeAddedToTransactionEvent",
    "WithdrawalMadeEvent"
]);

function isEventSupported(e) {
    return supportedEvents.has(e.eventType);
}

// -------------------------------
// Stream naming
// -------------------------------
function getStreamName(merchantId) {
    return "MerchantBalanceArchive-" + merchantId.replace(/-/gi, "");
}

// -------------------------------
// Pipeline (single responsibility flow)
// -------------------------------
function processEvent(e) {
    if (!isValidEvent(e)) return;

    const merchantId = getMerchantId(e);
    if (!merchantId) return;

    if (!isEventSupported(e)) return;

    const streamName = getStreamName(merchantId);
    linkTo(streamName, e);
}

// -------------------------------
// Projection
// -------------------------------
fromAll()
    .when({
        $any: function (s, e) {
            processEvent(e);
        }
    });