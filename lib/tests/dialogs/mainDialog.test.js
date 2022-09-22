"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const botbuilder_testing_1 = require("botbuilder-testing");
const bookingDialog_1 = require("../../dialogs/bookingDialog");
const flightBookingRecognizer_1 = require("../../dialogs/flightBookingRecognizer");
const mainDialog_1 = require("../../dialogs/mainDialog");
const assert = require('assert');
// tslint:disable max-classes-per-file
/**
 * A mock FlightBookingRecognizer for our main dialog tests that takes
 * a mock luis result and can set as isConfigured === false.
 */
class MockFlightBookingRecognizer extends flightBookingRecognizer_1.FlightBookingRecognizer {
    constructor(isConfigured, mockResult) {
        super(isConfigured);
        this.mockResult = mockResult;
        this.isLuisConfigured = isConfigured;
        this.mockResult = mockResult;
    }
    executeLuisQuery(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mockResult;
        });
    }
    get isConfigured() {
        return (this.isLuisConfigured);
    }
}
/**
 * A simple mock for Booking dialog that just returns a preset booking info for tests.
 */
class MockBookingDialog extends bookingDialog_1.BookingDialog {
    constructor() {
        super('bookingDialog');
    }
    beginDialog(dc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const bookingDetails = {
                destination: 'Seattle',
                origin: 'New York',
                travelDate: '2025-07-08'
            };
            yield dc.context.sendActivity(`${this.id} mock invoked`);
            return yield dc.endDialog(bookingDetails);
        });
    }
}
/**
 * A specialized mock for BookingDialog that displays a dummy TextPrompt.
 * The dummy prompt is used to prevent the MainDialog waterfall from moving to the next step
 * and assert that the main dialog was called.
 */
class MockBookingDialogWithPrompt extends bookingDialog_1.BookingDialog {
    constructor() {
        super('bookingDialog');
    }
    beginDialog(dc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            dc.dialogs.add(new botbuilder_dialogs_1.TextPrompt('MockDialog'));
            return yield dc.prompt('MockDialog', { prompt: `${this.id} mock invoked` });
        });
    }
}
describe('MainDialog', () => {
    it('Shows message if LUIS is not configured and calls BookingDialogDirectly', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockRecognizer = new MockFlightBookingRecognizer(false);
        const mockBookingDialog = new MockBookingDialogWithPrompt();
        const sut = new mainDialog_1.MainDialog(mockRecognizer, mockBookingDialog);
        const client = new botbuilder_testing_1.DialogTestClient('test', sut, null, [new botbuilder_testing_1.DialogTestLogger()]);
        const reply = yield client.sendActivity('hi');
        assert.strictEqual(reply.text, 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.', 'Did not warn about missing luis');
    }));
    it('Shows prompt if LUIS is configured', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockRecognizer = new MockFlightBookingRecognizer(true);
        const mockBookingDialog = new MockBookingDialog();
        const sut = new mainDialog_1.MainDialog(mockRecognizer, mockBookingDialog);
        const client = new botbuilder_testing_1.DialogTestClient('test', sut, null, [new botbuilder_testing_1.DialogTestLogger()]);
        const reply = yield client.sendActivity('hi');
        assert.strictEqual(reply.text, 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"', 'Did not show prompt');
    }));
    describe('Invokes tasks based on LUIS intent', () => {
        // Create array with test case data.
        const testCases = [
            { utterance: 'I want to book a flight', intent: 'BookFlight', invokedDialogResponse: 'bookingDialog mock invoked', taskConfirmationMessage: 'I have you booked to Seattle from New York' },
            { utterance: `What's the weather like?`, intent: 'GetWeather', invokedDialogResponse: 'TODO: get weather flow here', taskConfirmationMessage: undefined },
            { utterance: 'bananas', intent: 'None', invokedDialogResponse: `Sorry, I didn't get that. Please try asking in a different way (intent was None)`, taskConfirmationMessage: undefined }
        ];
        testCases.map((testData) => {
            it(testData.intent, () => __awaiter(void 0, void 0, void 0, function* () {
                // Create LuisResult for the mock recognizer.
                const mockLuisResult = JSON.parse(`{"intents": {"${testData.intent}": {"score": 1}}, "entities": {"$instance": {}}}`);
                const mockRecognizer = new MockFlightBookingRecognizer(true, mockLuisResult);
                const bookingDialog = new MockBookingDialog();
                const sut = new mainDialog_1.MainDialog(mockRecognizer, bookingDialog);
                const client = new botbuilder_testing_1.DialogTestClient('test', sut, null, [new botbuilder_testing_1.DialogTestLogger()]);
                // Execute the test case
                console.log(`Test Case: ${testData.intent}`);
                let reply = yield client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"');
                reply = yield client.sendActivity(testData.utterance);
                assert.strictEqual(reply.text, testData.invokedDialogResponse);
                // The Booking dialog displays an additional confirmation message, assert that it is what we expect.
                if (testData.taskConfirmationMessage) {
                    reply = client.getNextReply();
                    assert(reply.text.startsWith(testData.taskConfirmationMessage));
                }
                // Validate that the MainDialog starts over once the task is completed.
                reply = client.getNextReply();
                assert.strictEqual(reply.text, 'What else can I do for you?');
            }));
        });
    });
    describe('Shows unsupported cities warning', () => {
        // Create array with test case data.
        const testCases = [
            { jsonFile: 'FlightToMadrid.json', expectedMessage: 'Sorry but the following airports are not supported: madrid' },
            { jsonFile: 'FlightFromMadridToChicago.json', expectedMessage: 'Sorry but the following airports are not supported: madrid, chicago' },
            { jsonFile: 'FlightFromCdgToJfk.json', expectedMessage: 'Sorry but the following airports are not supported: cdg' },
            { jsonFile: 'FlightFromParisToNewYork.json', expectedMessage: 'bookingDialog mock invoked' }
        ];
        testCases.map((testData) => {
            it(testData.jsonFile, () => __awaiter(void 0, void 0, void 0, function* () {
                // Create LuisResult for the mock recognizer.
                const mockLuisResult = require(`../../../testResources/${testData.jsonFile}`);
                const mockRecognizer = new MockFlightBookingRecognizer(true, mockLuisResult);
                const bookingDialog = new MockBookingDialog();
                const sut = new mainDialog_1.MainDialog(mockRecognizer, bookingDialog);
                const client = new botbuilder_testing_1.DialogTestClient('test', sut, null, [new botbuilder_testing_1.DialogTestLogger()]);
                // Execute the test case
                console.log(`Test Case: ${mockLuisResult.text}`);
                let reply = yield client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"');
                reply = yield client.sendActivity(mockLuisResult.text);
                assert.strictEqual(reply.text, testData.expectedMessage);
            }));
        });
    });
});
//# sourceMappingURL=mainDialog.test.js.map