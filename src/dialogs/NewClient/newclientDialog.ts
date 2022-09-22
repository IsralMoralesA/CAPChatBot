// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { InputHints, MessageFactory } from 'botbuilder';
import {
    ConfirmPrompt,
    DialogTurnResult,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { newclientDetails } from './newclientDetails';
import { newcontratoDialog } from './newcontratoDialog';

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

export class newclientDialog extends newcontratoDialog {
    constructor(id: string) {
        super(id || 'newclientDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.contratarStep.bind(this),
                this.cambiarStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a contratar city has not been provided, prompt for one.
     */
    private async contratarStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const NewClientDetails = stepContext.options as newclientDetails;

        if (!NewClientDetails.Contratar) {
            const messageText = 'Te gustaria contratar?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        } else {
            return await stepContext.next(NewClientDetails.Contratar);
        }
    }

    /**
     * If an cambiar city has not been provided, prompt for one.
     */
    private async cambiarStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const NewClientDetails = stepContext.options as newclientDetails;

        // Capture the response to the previous step's prompt
        NewClientDetails.Cambiar = stepContext.result;
        if (!NewClientDetails.Cambiar) {
            const messageText = 'Te gustaria cambiar de paquete?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        } else {
            return await stepContext.next(NewClientDetails.Cambiar);
        }
    }

    /**
     * Complete the interaction and end the dialog.
     */
    private async finalStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        if (stepContext.result === true) {
            const NewClientDetails = stepContext.options as newclientDetails;

            return await stepContext.endDialog(NewClientDetails);
        }
        return await stepContext.endDialog();
    }

    private isAmbiguous(timex: string): boolean {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}
