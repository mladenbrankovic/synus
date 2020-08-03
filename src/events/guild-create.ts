import { Logger } from '@src/util/logger';
import { Listener } from 'discord-akairo';
import { Guild } from 'discord.js';

export default class GuildCreateEvent extends Listener {
  public constructor() {
    super('guildCreate', {
      emitter: 'client',
      event: 'guildCreate',
      category: 'client',
    });
  }

  public async exec(guild: Guild): Promise<void> {
    Logger.error(
      `[GUILD JOIN] ${this.client.user.tag} was added to ${guild.name} (${guild.id}). Guild owner: ${guild.owner.user.tag}`
    );
  }
}
