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
exports.MainDialog = void 0;
const recognizers_text_data_types_timex_expression_1 = require("@microsoft/recognizers-text-data-types-timex-expression");
const bookingDetails_1 = require("./Booking/bookingDetails");
const botbuilder_1 = require("botbuilder");
const botbuilder_ai_1 = require("botbuilder-ai");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
class MainDialog extends botbuilder_dialogs_1.ComponentDialog {
    constructor(luisRecognizer, bookingDialog) {
        super('MainDialog');
        if (!luisRecognizer)
            throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        if (!bookingDialog)
            throw new Error('[MainDialog]: Missing parameter \'bookingDialog\' is required');
        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new botbuilder_dialogs_1.TextPrompt('TextPrompt'))
            .addDialog(bookingDialog)
            .addDialog(new botbuilder_dialogs_1.WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.introStep.bind(this),
            this.actStep.bind(this),
            this.finalStep.bind(this)
        ]));
        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }
    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */
    run(context, accessor) {
        return __awaiter(this, void 0, void 0, function* () {
            const dialogSet = new botbuilder_dialogs_1.DialogSet(accessor);
            dialogSet.add(this);
            const dialogContext = yield dialogSet.createContext(context);
            const results = yield dialogContext.continueDialog();
            if (results.status === botbuilder_dialogs_1.DialogTurnStatus.empty) {
                yield dialogContext.beginDialog(this.id);
            }
        });
    }
    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    introStep(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.luisRecognizer.isConfigured) {
                const luisConfigMsg = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
                yield stepContext.context.sendActivity(luisConfigMsg, null, botbuilder_1.InputHints.IgnoringInput);
                return yield stepContext.next();
            }
            const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"';
            const promptMessage = botbuilder_1.MessageFactory.text(messageText, messageText, botbuilder_1.InputHints.ExpectingInput);
            return yield stepContext.prompt('TextPrompt', { prompt: promptMessage });
        });
    }
    /**
     * Second step in the waterall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    actStep(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const bookingDetails = new bookingDetails_1.BookingDetails();
            if (!this.luisRecognizer.isConfigured) {
                // LUIS is not configured, we just run the BookingDialog path.
                return yield stepContext.beginDialog('bookingDialog', bookingDetails);
            }
            // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
            const luisResult = yield this.luisRecognizer.executeLuisQuery(stepContext.context);
            switch (botbuilder_ai_1.LuisRecognizer.topIntent(luisResult)) {
                case 'BookFlight':
                    // Extract the values for the composite entities from the LUIS result.
                    const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
                    const toEntities = this.luisRecognizer.getToEntities(luisResult);
                    // Show a warning for Origin and Destination if we can't resolve them.
                    yield this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);
                    // Initialize BookingDetails with any entities we may have found in the response.
                    bookingDetails.destination = toEntities.airport;
                    bookingDetails.origin = fromEntities.airport;
                    bookingDetails.travelDate = this.luisRecognizer.getTravelDate(luisResult);
                    console.log('LUIS extracted these booking details:', JSON.stringify(bookingDetails));
                    // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
                    return yield stepContext.beginDialog('bookingDialog', bookingDetails);
                case 'GetWeather':
                    // We haven't implemented the GetWeatherDialog so we just display a TODO message.
                    const getWeatherMessageText = 'TODO: get weather flow here';
                    yield stepContext.context.sendActivity(getWeatherMessageText, getWeatherMessageText, botbuilder_1.InputHints.IgnoringInput);
                    break;
                default:
                    // Catch all for unhandled intents
                    const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${botbuilder_ai_1.LuisRecognizer.topIntent(luisResult)})`;
                    yield stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, botbuilder_1.InputHints.IgnoringInput);
            }
            return yield stepContext.next();
        });
    }
    /**
     * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
     * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
     * will be empty if those entity values can't be mapped to a canonical item in the Airport.
     */
    showWarningForUnsupportedCities(context, fromEntities, toEntities) {
        return __awaiter(this, void 0, void 0, function* () {
            const unsupportedCities = [];
            if (fromEntities.from && !fromEntities.airport) {
                unsupportedCities.push(fromEntities.from);
            }
            if (toEntities.to && !toEntities.airport) {
                unsupportedCities.push(toEntities.to);
            }
            if (unsupportedCities.length) {
                const messageText = `Sorry but the following airports are not supported: ${unsupportedCities.join(', ')}`;
                yield context.sendActivity(messageText, messageText, botbuilder_1.InputHints.IgnoringInput);
            }
        });
    }
    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    finalStep(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
            if (stepContext.result) {
                const result = stepContext.result;
                // Now we have all the booking details.
                // This is where calls to the booking AOU service or database would go.
                // If the call to the booking service was successful tell the user.
                const timeProperty = new recognizers_text_data_types_timex_expression_1.TimexProperty(result.travelDate);
                const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
                const msg = `I have you booked to ${result.destination} from ${result.origin} on ${travelDateMsg}.`;
                yield stepContext.context.sendActivity(msg);
            }
            // Restart the main dialog waterfall with a different message the second time around
            return yield stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
        });
    }
}
exports.MainDialog = MainDialog;
//# sourceMappingURL=mainDialog.js.map