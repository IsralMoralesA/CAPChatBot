import { BotState } from 'botbuilder';
import { Dialog } from 'botbuilder-dialogs';
import { DialogBot } from './dialogBot';
export declare class DialogAndWelcomeBot extends DialogBot {
    constructor(conversationState: BotState, userState: BotState, dialog: Dialog);
}
