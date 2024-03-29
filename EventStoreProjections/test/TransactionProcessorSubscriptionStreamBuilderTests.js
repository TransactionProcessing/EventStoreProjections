var testData = require('./TestData.js');
testData.clearRequireCache();

require('../../NugetPackage/projections/continuous/TransactionProcessorSubscriptionStreamBuilder.js');
var projection = require('event-store-projection-testing-framework');
var chai = require("chai");

describe('Transaction Processor Subscription Stream Builder Tests', function () {
    it('Projection Can Handle Estate Created Event', function(){
        projection.initialize();

        projection.setState({ estates: {} });

        var estateId = '3bf2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var estateName = 'Demo Estate 1';
        var estateNameNoSpaces = 'DemoEstate1';

        var estateCreatedEvent = testData.getEstateCreatedEvent(estateId, estateName);

        projection.processEvent(
            'EstateAggregate-' + estateId.replace(/-/gi, ""),
            estateCreatedEvent.eventType,
            estateCreatedEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;
        chai.expect(projectionState.estates[estateId]).to.not.be.null;
        chai.expect(projectionState.estates[estateId].name).equal(estateNameNoSpaces);
        chai.expect(projectionState.estates[estateId].filteredName).equal(estateName);
    })

    it('Projection Can Handle Transaction Events', function(){
        projection.initialize();

        projection.setState({ estates: {} });

        var estateId = '3bf2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var estateName = 'Demo Estate';
        var estateNameNoSpaces = 'DemoEstate';
        var merchantId = "30ebc670-88ac-4c0c-9631-77547a687bbc";
        var transactionId = "b846cec7-b751-4b33-8da5-5382ebc57541";
        var customerEmailAddress = "customer@myemail.com";

        var estateCreatedEvent = testData.getEstateCreatedEvent(estateId, estateName);

        projection.processEvent(
            'EstateAggregate-' + estateId.replace(/-/gi, ""),
            estateCreatedEvent.eventType,
            estateCreatedEvent.data);

        var customerEmailReceiptRequestedEvent =
            testData.getCustomerEmailReceiptRequestedEvent(estateId, merchantId, transactionId, customerEmailAddress);

        projection.processEvent(
            'TransactionAggregate-' + transactionId.replace(/-/gi, ""),
            customerEmailReceiptRequestedEvent.eventType,
            customerEmailReceiptRequestedEvent.data);

        var transactionHasBeenCompletedEvent =
            testData.getTransactionHasBeenCompletedEvent(estateId, merchantId, transactionId, true, 100.00);

        projection.processEvent(
            'TransactionAggregate-' + transactionId.replace(/-/gi, ""),
            transactionHasBeenCompletedEvent.eventType,
            transactionHasBeenCompletedEvent.data);

        var calculatedValue = 5.00;
        var eventCreatedDateTime = "2020-05-16T07:47:51.6617562+00:00";
        var settledMerchantFeeAddedToTransactionEvent = testData.getSettledMerchantFeeAddedToTransactionEvent(estateId,
                merchantId,
                transactionId,
                calculatedValue,
                eventCreatedDateTime);
        
        projection.processEvent(
            'TransactionAggregate-' + transactionId.replace(/-/gi, ""),
            settledMerchantFeeAddedToTransactionEvent.eventType,
            settledMerchantFeeAddedToTransactionEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;
        chai.expect(projectionState.estates[estateId]).to.not.be.null;
        chai.expect(projectionState.estates[estateId].name).equal(estateNameNoSpaces);
        chai.expect(projectionState.estates[estateId].filteredName).equal(estateName);

        var events = projection.emittedEvents;
        chai.expect(events.length).equal(3);
    })
})