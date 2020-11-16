var chai = require('chai');
require('../src/continuous/MerchantBalanceCalculator.js');
var projection = require('event-store-projection-testing');
var testData = require('./TestData.js');

describe('Merchant Balance Calculator Tests', function()
{
    beforeEach(function () { projection.initialize(); });

    it('Projection handles merchant created events', function()
    {
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var streamName = "$ce-MerchantArchive";
        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.merchantName).to.equal(merchantCreatedEvent.data.MerchantName);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(1);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");
    });

    it('Projection handles merchant manual deposit event', function () {

        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime = '2020-05-30T06:21:31.356Z';
        var depositAmount = 1000.00;
        var streamName = "$ce-MerchantArchive";

        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime,depositAmount);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent.eventType,
            manualDepositMadeEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount);
        chai.expect(projectionState.balance).to.equal(depositAmount);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(2);

        var eventBody = JSON.parse(events[0].body);

        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");
    });

    it('Projection handles multiple merchant manual deposit event', function () {
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime1 = '2020-05-30T06:21:31.356Z';
        var depositAmount1 = 1000.00;
        var depositDateTime2 = '2020-06-01T06:21:31.356Z';
        var depositAmount2 = 500.00;
        var streamName = "$ce-MerchantArchive";

        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent1 = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime1, depositAmount1);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent1.eventType,
            manualDepositMadeEvent1.data);

        var manualDepositMadeEvent2 = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime2, depositAmount2);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent2.eventType,
            manualDepositMadeEvent2.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(projectionState.balance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime2);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(3);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount1);
        chai.expect(eventBody.balance).to.equal(depositAmount1);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount1);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(eventBody.balance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount2);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");
    });

    it('Projection handles multiple merchant manual deposit event not in date order', function () {
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime2 = '2020-05-30T06:21:31.356Z';
        var depositAmount2 = 1000.00;
        var depositDateTime1 = '2020-06-01T06:21:31.356Z';
        var depositAmount1 = 500.00;
        var expectedBalance = depositAmount1 + depositAmount2;
        var streamName = "$ce-MerchantArchive";

        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent1 = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime1, depositAmount1);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent1.eventType,
            manualDepositMadeEvent1.data);

        var manualDepositMadeEvent2 = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime2, depositAmount2);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent2.eventType,
            manualDepositMadeEvent2.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(projectionState.balance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime1);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(3);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount1);
        chai.expect(eventBody.balance).to.equal(depositAmount1);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount1);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(eventBody.balance).to.equal(depositAmount1 + depositAmount2);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount2);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");
    });

    it('Projection reduces available balance after transaction started message processed', function()
    {
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime = '2020-06-01T06:21:31.356Z';
        var depositAmount = 5000.00;
        var transactionId = 'cf80660e-88c1-434c-a063-92e9076eda1b';
        var transactionAmount = 100.00;
        var transactionType = 'Sale';
        var streamName = "$ce-MerchantArchive";

        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime, depositAmount);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent.eventType,
            manualDepositMadeEvent.data);

        var transactionHasStartedEvent = testData.getTransactionHasStartedEvent(estateId,merchantId, transactionId, transactionAmount, transactionType);

        projection.processEvent(
            streamName,
            transactionHasStartedEvent.eventType,
            transactionHasStartedEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(projectionState.balance).to.equal(depositAmount);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime);
        chai.expect(projectionState.lastSaleDateTime).to.equal(transactionHasStartedEvent.data.TransactionDateTime);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(3);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Transaction Started");
    });

    it('Projection reduces balance after transaction completed message processed if transaction is successful', function () {
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime = '2020-06-01T06:21:31.356Z';
        var depositAmount = 5000.00;
        var transactionId = 'cf80660e-88c1-434c-a063-92e9076eda1b';
        var transactionAmount = 100.00;
        var transactionType = 'Sale';
        var streamName = "$ce-MerchantArchive";


        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime, depositAmount);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent.eventType,
            manualDepositMadeEvent.data);

        var transactionHasStartedEvent = testData.getTransactionHasStartedEvent(estateId, merchantId, transactionId, transactionAmount, transactionType);

        projection.processEvent(
            streamName,
            transactionHasStartedEvent.eventType,
            transactionHasStartedEvent.data);

        var transactionHasBeenCompletedEvent =
            testData.getTransactionHasBeenCompletedEvent(estateId, merchantId, transactionId, true);

        projection.processEvent(
            '$et-TransactionProcessor.Transaction.DomainEvents.TransactionHasBeenCompletedEvent',
            transactionHasBeenCompletedEvent.eventType,
            transactionHasBeenCompletedEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(projectionState.balance).to.equal(depositAmount - transactionAmount);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime);
        chai.expect(projectionState.lastSaleDateTime).to.equal(transactionHasStartedEvent.data.TransactionDateTime);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(4);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Transaction Started");

        var eventBody = JSON.parse(events[3].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.changeAmount).to.equal(transactionAmount);
        chai.expect(eventBody.reference).to.equal("Transaction Completed");
    });

    it('Projection resets available balance after transaction completed message processed if transaction is not successful', function () {
    
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime = '2020-06-01T06:21:31.356Z';
        var depositAmount = 5000.00;
        var transactionId = 'cf80660e-88c1-434c-a063-92e9076eda1b';
        var transactionAmount = 100.00;
        var transactionType = 'Sale';
        var streamName = "$ce-MerchantArchive";


        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime, depositAmount);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent.eventType,
            manualDepositMadeEvent.data);

        var transactionHasStartedEvent = testData.getTransactionHasStartedEvent(estateId, merchantId, transactionId, transactionAmount, transactionType);

        projection.processEvent(
            streamName,
            transactionHasStartedEvent.eventType,
            transactionHasStartedEvent.data);

        var transactionHasBeenCompletedEvent =
            testData.getTransactionHasBeenCompletedEvent(estateId, merchantId, transactionId, false);

        projection.processEvent(
            '$et-TransactionProcessor.Transaction.DomainEvents.TransactionHasBeenCompletedEvent',
            transactionHasBeenCompletedEvent.eventType,
            transactionHasBeenCompletedEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount);
        chai.expect(projectionState.balance).to.equal(depositAmount);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime);
        chai.expect(projectionState.lastSaleDateTime).to.equal(transactionHasStartedEvent.data.TransactionDateTime);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(4);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Transaction Started");

        var eventBody = JSON.parse(events[3].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(transactionAmount);
        chai.expect(eventBody.reference).to.equal("Transaction Completed");

    });

    it('Projection handles merchant fee event', function () {
        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime = '2020-06-01T06:21:31.356Z';
        var depositAmount = 5000.00;
        var transactionId = 'cf80660e-88c1-434c-a063-92e9076eda1b';
        var transactionAmount = 100.00;
        var transactionType = 'Sale';
        var feeEventCreatedDateTime = '2020-05-30T06:21:31.356Z';
        var calculatedValue = 0.50;

        var streamName = "$ce-MerchantArchive";

        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime, depositAmount);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent.eventType,
            manualDepositMadeEvent.data);

        var transactionHasStartedEvent = testData.getTransactionHasStartedEvent(estateId, merchantId, transactionId, transactionAmount, transactionType);

        projection.processEvent(
            streamName,
            transactionHasStartedEvent.eventType,
            transactionHasStartedEvent.data);

        var transactionHasBeenCompletedEvent =
            testData.getTransactionHasBeenCompletedEvent(estateId, merchantId, transactionId, true);

        projection.processEvent(
            '$et-TransactionProcessor.Transaction.DomainEvents.TransactionHasBeenCompletedEvent',
            transactionHasBeenCompletedEvent.eventType,
            transactionHasBeenCompletedEvent.data);

        var merchantFeeAddedToTransactionEvent = testData.getMerchantFeeAddedToTransactionEvent(estateId, merchantId, transactionId, calculatedValue, feeEventCreatedDateTime);

        projection.processEvent(
            streamName,
            merchantFeeAddedToTransactionEvent.eventType,
            merchantFeeAddedToTransactionEvent.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount - transactionAmount + calculatedValue);
        chai.expect(projectionState.balance).to.equal(depositAmount - transactionAmount + calculatedValue);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime);
        chai.expect(projectionState.lastSaleDateTime).to.equal(transactionHasStartedEvent.data.TransactionDateTime);
        chai.expect(projectionState.lastFeeProcessedDateTime).to.equal(merchantFeeAddedToTransactionEvent.data.EventCreatedDateTime);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(5);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Transaction Started");

        var eventBody = JSON.parse(events[3].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.changeAmount).to.equal(transactionAmount);
        chai.expect(eventBody.reference).to.equal("Transaction Completed");

        var eventBody = JSON.parse(events[4].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount + calculatedValue);
        chai.expect(eventBody.balance).to.equal(depositAmount - transactionAmount + calculatedValue);
        chai.expect(eventBody.changeAmount).to.equal(calculatedValue);
        chai.expect(eventBody.reference).to.equal("Transaction Fee Processed");
    });

    it('Projection handles multiple merchant fee event not in date order', function () {

        var estateId = '2af2dab2-86d6-44e3-bcf8-51bec65cf8bc';
        var merchantId = '6be48c04-a00e-4985-a50c-e27461ca47e1';
        var merchantName = 'Test Merchant 1';
        var depositDateTime = '2020-06-01T06:21:31.356Z';
        var depositAmount = 5000.00;
        var transactionId = 'cf80660e-88c1-434c-a063-92e9076eda1b';
        var transactionAmount = 100.00;
        var transactionType = 'Sale';
        var feeEventCreatedDateTime1 = '2020-05-30T06:21:31.356Z';
        var calculatedValue1 = 0.50;
        var feeEventCreatedDateTime2 = '2020-05-30T04:21:31.356Z';
        var calculatedValue2 = 0.75;

        var streamName = "$ce-MerchantArchive";

        var merchantCreatedEvent = testData.getMerchantCreatedEvent(estateId, merchantId, merchantName);

        projection.processEvent(
            streamName,
            merchantCreatedEvent.eventType,
            merchantCreatedEvent.data);

        var manualDepositMadeEvent = testData.getManualDepositMadeEvent(estateId, merchantId, depositDateTime, depositAmount);

        projection.processEvent(
            streamName,
            manualDepositMadeEvent.eventType,
            manualDepositMadeEvent.data);

        var transactionHasStartedEvent = testData.getTransactionHasStartedEvent(estateId, merchantId, transactionId, transactionAmount, transactionType);

        projection.processEvent(
            streamName,
            transactionHasStartedEvent.eventType,
            transactionHasStartedEvent.data);

        var transactionHasBeenCompletedEvent =
            testData.getTransactionHasBeenCompletedEvent(estateId, merchantId, transactionId, true);

        projection.processEvent(
            '$et-TransactionProcessor.Transaction.DomainEvents.TransactionHasBeenCompletedEvent',
            transactionHasBeenCompletedEvent.eventType,
            transactionHasBeenCompletedEvent.data);

        var merchantFeeAddedToTransactionEvent1 = testData.getMerchantFeeAddedToTransactionEvent(estateId, merchantId, transactionId, calculatedValue1, feeEventCreatedDateTime1);

        projection.processEvent(
            streamName,
            merchantFeeAddedToTransactionEvent1.eventType,
            merchantFeeAddedToTransactionEvent1.data);

        var merchantFeeAddedToTransactionEvent2 = testData.getMerchantFeeAddedToTransactionEvent(estateId, merchantId, transactionId, calculatedValue2, feeEventCreatedDateTime2);

        projection.processEvent(
            streamName,
            merchantFeeAddedToTransactionEvent2.eventType,
            merchantFeeAddedToTransactionEvent2.data);

        var projectionState = projection.getState();

        chai.expect(projectionState).to.not.be.null;

        chai.expect(projectionState.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(projectionState.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(projectionState.availableBalance).to.equal(depositAmount - transactionAmount + calculatedValue1 + calculatedValue2);
        chai.expect(projectionState.balance).to.equal(depositAmount - transactionAmount + calculatedValue1 + calculatedValue2);
        chai.expect(projectionState.lastDepositDateTime).to.equal(depositDateTime);
        chai.expect(projectionState.lastSaleDateTime).to.equal(transactionHasStartedEvent.data.TransactionDateTime);
        chai.expect(projectionState.lastFeeProcessedDateTime).to.equal(merchantFeeAddedToTransactionEvent1.data.EventCreatedDateTime);

        var events = projection.emittedEvents;
        chai.expect(events.length).to.equal(6);

        var eventBody = JSON.parse(events[0].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(0);
        chai.expect(eventBody.balance).to.equal(0);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Merchant Created");

        var eventBody = JSON.parse(events[1].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(depositAmount);
        chai.expect(eventBody.reference).to.equal("Merchant Deposit");

        var eventBody = JSON.parse(events[2].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount);
        chai.expect(eventBody.changeAmount).to.equal(0);
        chai.expect(eventBody.reference).to.equal("Transaction Started");

        var eventBody = JSON.parse(events[3].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.balance).to.equal(depositAmount - transactionAmount);
        chai.expect(eventBody.changeAmount).to.equal(transactionAmount);
        chai.expect(eventBody.reference).to.equal("Transaction Completed");

        var eventBody = JSON.parse(events[4].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount + calculatedValue1);
        chai.expect(eventBody.balance).to.equal(depositAmount - transactionAmount + calculatedValue1);
        chai.expect(eventBody.changeAmount).to.equal(calculatedValue1);
        chai.expect(eventBody.reference).to.equal("Transaction Fee Processed");

        var eventBody = JSON.parse(events[5].body);
        chai.expect(eventBody.aggregateId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.estateId).to.equal(merchantCreatedEvent.data.EstateId);
        chai.expect(eventBody.merchantId).to.equal(merchantCreatedEvent.data.MerchantId);
        chai.expect(eventBody.availableBalance).to.equal(depositAmount - transactionAmount + calculatedValue1 + calculatedValue2);
        chai.expect(eventBody.balance).to.equal(depositAmount - transactionAmount + calculatedValue1 + calculatedValue2);
        chai.expect(eventBody.changeAmount).to.equal(calculatedValue2);
        chai.expect(eventBody.reference).to.equal("Transaction Fee Processed");
    });
});