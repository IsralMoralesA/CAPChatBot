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
const dialogAndWelcomeBot_1 = require("../../bots/dialogAndWelcomeBot");
const assert = require('assert');
/**
 * A simple mock for a root dialog that gets invoked by the bot.
 */
class MockRootDialog extends botbuilder_dialogs_1.Dialog {
    constructor() {
        super('mockRootDialog');
    }
    beginDialog(dc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield dc.context.sendActivity(`${this.id} mock invoked`);
            return yield dc.endDialog();
        });
    }
    run(turnContext, accessor) {
        return __awaiter(this, void 0, void 0, function* () {
            const dialogSet = new botbuilder_dialogs_1.DialogSet(accessor);
            dialogSet.add(this);
            const dialogContext = yield dialogSet.createContext(turnContext);
            const results = yield dialogContext.continueDialog();
            if (results.status === botbuilder_dialogs_1.DialogTurnStatus.empty) {
                yield dialogContext.beginDialog(this.id);
            }
        });
    }
}
describe('DialogAndWelcomeBot', () => {
    const testAdapter = new botbuilder_1.TestAdapter((context) => __awaiter(void 0, void 0, void 0, function* () { return undefined; }));
    function processActivity(activity, bot) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = new botbuilder_1.TurnContext(testAdapter, activity);
            yield bot.run(context);
        });
    }
    it('Shows welcome card on member added and starts main dialog', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockRootDialog = new MockRootDialog();
        const memoryStorage = new botbuilder_1.MemoryStorage();
        const sut = new dialogAndWelcomeBot_1.DialogAndWelcomeBot(new botbuilder_1.ConversationState(memoryStorage), new botbuilder_1.UserState(memoryStorage), mockRootDialog);
        // Create conversationUpdate activity
        const conversationUpdateActivity = {
            channelId: 'test',
            conversation: {
                id: 'someId'
            },
            membersAdded: [
                { id: 'theUser' }
            ],
            recipient: { id: 'theBot' },
            type: botbuilder_1.ActivityTypes.ConversationUpdate
        };
        // Send the conversation update activity to the bot.
        yield processActivity(conversationUpdateActivity, sut);
        // Assert we got the welcome card
        let reply = testAdapter.activityBuffer.shift();
        assert.strictEqual(reply.attachments.length, 1);
        assert.strictEqual(reply.attachments[0].contentType, 'application/vnd.microsoft.card.adaptive');
        // Assert that we started the main dialog.
        reply = testAdapter.activityBuffer.shift();
        assert.strictEqual(reply.text, 'mockRootDialog mock invoked');
    }));
});
//# sourceMappingURL=dialogAndWelcomeBot.test.js.map