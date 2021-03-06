import { languageNames } from '@data/language-names';
import { Logger } from '@util/logger';
import { TextFormatter } from '@util/text-formatter';
import translator, { ITranslateResponse } from '@vitalets/google-translate-api';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class Translate extends Command {
  public constructor() {
    super('translate', {
      aliases: ['translate', 'trans', 'tr', 't'],
      category: 'General',
      description: {
        content:
          'Translate a given query or a target message. Queries are prioritized over messages.',
        usage:
          "synus translate [ from:string = 'auto' ] [ to:string = 'en' ] [ query:string ] [ -m message:int = 1 ]",
      },
      args: [
        {
          id: 'from',
          type: 'string',
          match: 'phrase',
          default: 'auto',
          index: 0,
        },
        {
          id: 'to',
          type: 'string',
          match: 'phrase',
          default: 'en',
          index: 1,
        },
        {
          id: 'query',
          type: 'string',
          match: 'rest',
          index: 2,
        },
        {
          id: 'message',
          type: 'int',
          match: 'option',
          flag: ['-m '],
          default: 0,
        },
      ],
    });
  }

  public async exec(
    message: Message,
    args: { from: string; to: string; query: string; message: number }
  ): Promise<void> {
    args.from = args.from.toLocaleLowerCase();
    args.to = args.to.toLocaleLowerCase();
    args.message = Number(args.message);

    // Source language is not valid
    if (args.from !== 'auto' && !languageNames[args.from]) {
      message.channel.send(`${args.from.toUpperCase()} is not a valid language code.`);
      Logger.log(`Illegal language code (${args.from.toUpperCase()})`);
      return;
    }

    // Target language is not valid
    if (!languageNames[args.to]) {
      message.channel.send(`${args.to.toUpperCase()} is not a valid ISO language code.`);
      Logger.log(`Illegal language code (${args.to.toUpperCase()})`);
      return;
    }

    // Message was unset, default to 1
    if (args.message === 0 && !args.query) args.message = 1;

    // Invalid message target and no implicit query
    if (args.message < 1 && !args.query) {
      message.channel.send("Sorry, I can't translate that message.");
      Logger.log(`Invalid message target (${args.message}) and no implicit query`);
      return;
    }

    try {
      const translation: ITranslateResponse = args.query
        ? await this.translateQuery(args)
        : await this.translateMessage(message, args);

      if (translation) {
        const requestedSourceLanguage =
          args.from === 'auto'
            ? languageNames[translation.from.language.iso]
            : languageNames[args.from];
        const detectedSourceLanguage = languageNames[translation.from.language.iso];
        const targetLanguage = languageNames[args.to];

        const warn = requestedSourceLanguage !== detectedSourceLanguage;

        let response = '';

        if (warn) {
          response += ':warning:    ';
        }

        response +=
          TextFormatter.monospace(`[ ${requestedSourceLanguage} >> ${targetLanguage} ]`) +
          `    ${translation.text}`;

        if (warn) {
          response += `\n\nYou might have meant to translate from ${detectedSourceLanguage} (${translation.from.language.iso.toUpperCase()}) instead. Translation may not be accurate.`;
        }

        message.channel.send(response);
        Logger.log(
          `Translated ${requestedSourceLanguage} "${args.query}" to ${targetLanguage} "${translation.text}"`
        );
      }
    } catch (error) {
      message.channel.send('Yikes, something went wrong. Try running `synus translate` again.');
      Logger.error(error);
    }
  }

  /**
   * Translate a given string with details in `args`.
   *
   * @param args Arguments of translation request
   * @returns Fetched `ITranslateResponse` object
   */
  private async translateQuery(args: {
    from: string;
    to: string;
    query: string;
    message: number;
  }): Promise<ITranslateResponse> {
    return await translator(args.query, {
      from: args.from,
      to: args.to,
    });
  }

  /**
   * Find a message in the invoking message's channel using details in `args` and translate it.
   *
   * @param args Arguments of translation request
   * @returns Fetched `ITranslateResponse` object
   */
  private async translateMessage(
    message: Message,
    args: {
      from: string;
      to: string;
      query: string;
      message: number;
    }
  ): Promise<ITranslateResponse> {
    args.query = (await this.client.messageFromChannel(message.channel, args.message)).content;

    if (!args.query.trim()) {
      message.channel.send("Sorry, I can't translate that message.");
      Logger.log('Query is empty');
      return;
    }

    return await translator(args.query, {
      from: args.from,
      to: args.to,
    });
  }
}
