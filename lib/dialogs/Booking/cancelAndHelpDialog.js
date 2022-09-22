"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
exports.CancelAndHelpDialog = void 0;
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
/**
 * This base class watches for common phrases like "help" and "cancel" and takes action on them
 * BEFORE they reach the normal bot logic.
 */
class CancelAndHelpDialog extends botbuilder_dialogs_1.ComponentDialog {
    constructor(id) {
        super(id);
    }
    onContinueDialog(innerDc) {
        const _super = Object.create(null, {
            onContinueDialog: { get: () => super.onContinueDialog }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.interrupt(innerDc);
            if (result) {
                return result;
            }
            return yield _super.onContinueDialog.call(this, innerDc);
        });
    }
    interrupt(innerDc) {
        return __awaiter(this, void 0, void 0, function* () {
            if (innerDc.context.activity.text) {
                const text = innerDc.context.activity.text.toLowerCase();
                switch (text) {
                    case 'help':
                    case '?':
                        const helpMessageText = 'Show help here';
                        yield innerDc.context.sendActivity(helpMessageText, helpMessageText, botbuilder_1.InputHints.ExpectingInput);
                        return { status: botbuilder_dialogs_1.DialogTurnStatus.waiting };
                    case 'cancel':
                    case 'quit':
                        const cancelMessageText = 'Cancelling...';
                        yield innerDc.context.sendActivity(cancelMessageText, cancelMessageText, botbuilder_1.InputHints.IgnoringInput);
                        return yield innerDc.cancelAllDialogs();
                }
            }
        });
    }
}
exports.CancelAndHelpDialog = CancelAndHelpDialog;
//# sourceMappingURL=cancelAndHelpDialog.js.map