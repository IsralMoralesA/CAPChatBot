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
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const botbuilder_testing_1 = require("botbuilder-testing");
const cancelAndHelpDialog_1 = require("../../dialogs/cancelAndHelpDialog");
const assert = require('assert');
/**
 * An waterfall dialog derived from CancelAndHelpDialog for testing
 */
class TestCancelAndHelpDialog extends cancelAndHelpDialog_1.CancelAndHelpDialog {
    constructor() {
        super('TestCancelAndHelpDialog');
        this.addDialog(new botbuilder_dialogs_1.TextPrompt('TextPrompt'))
            .addDialog(new botbuilder_dialogs_1.WaterfallDialog('WaterfallDialog', [
            this.promptStep.bind(this),
            this.finalStep.bind(this)
        ]));
        this.initialDialogId = 'WaterfallDialog';
    }
    promptStep(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield stepContext.prompt('TextPrompt', { prompt: botbuilder_1.MessageFactory.text('Hi there') });
        });
    }
    finalStep(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield stepContext.endDialog();
        });
    }
}
describe('CancelAndHelpDialog', () => {
    describe('Should be able to cancel', () => {
        const testCases = ['cancel', 'quit'];
        testCases.map((testData) => {
            it(testData, () => __awaiter(void 0, void 0, void 0, function* () {
                const sut = new TestCancelAndHelpDialog();
                const client = new botbuilder_testing_1.DialogTestClient('test', sut, null, [new botbuilder_testing_1.DialogTestLogger()]);
                // Execute the test case
                let reply = yield client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
                reply = yield client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Cancelling...');
                assert.strictEqual(client.dialogTurnResult.status, 'complete');
            }));
        });
    });
    describe('Should be able to get help', () => {
        const testCases = ['help', '?'];
        testCases.map((testData) => {
            it(testData, () => __awaiter(void 0, void 0, void 0, function* () {
                const sut = new TestCancelAndHelpDialog();
                const client = new botbuilder_testing_1.DialogTestClient('test', sut, null, [new botbuilder_testing_1.DialogTestLogger()]);
                // Execute the test case
                let reply = yield client.sendActivity('Hi');
                assert.strictEqual(reply.text, 'Hi there');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
                reply = yield client.sendActivity(testData);
                assert.strictEqual(reply.text, 'Show help here');
                assert.strictEqual(client.dialogTurnResult.status, 'waiting');
            }));
        });
    });
});
//# sourceMappingURL=cancelAndHelpDialog.test.js.map