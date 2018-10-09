'use strict';

import Discord from 'discord.js';
import Enmap from 'enmap';
import Game from './game.js';

const { defaultSettings, token, cmd_channel, hardCodedPrefix } = require('./config.json');
const bot = new Discord.Client();

let cmdChannel = null;
let games = new Discord.Collection();

const NonGameHelpOption = 'config';
const GameHelpOption = 'game'

bot.commands = new Discord.Collection();

bot.settings = new Enmap({
    name: 'settings',
    fetchAll: false,
    autoFetch: true,
    cloneLevel: 'deep'
});

const NonGameCommands = new Discord.Collection([
    ['setPrefixCmd', {
        name: 'setprefix',
        description: 'Sets the command prefix (default is !)',
        usage: 'setprefix <characters>',
        action: setPrefixCharacter
    }],
    ['setChannelCmd', {
        name: 'setchannel',
        description: 'sets which text channel should be used',
        usage: 'setchannel <channel name or ID>',
        action: setCmdChannel
    }],
    ['toggleBoardVisuals', {
        name: 'visuals',
        description: 'toggles the gameboard visuals',
        usage: 'visuals',
        action: toggleBoardVisuals
    }],
    ['viewSettingsCmd', {
        name: 'settings',
        description: 'displays the current configuration',
        usage: 'settings',
        action: displayGuildConfig
    }],
    ['resetConfig', {
        name: 'resetconfig',
        description: 'Resets the configuration to default',
        usage: 'resetconfig',
        action: resetGuildConfig
    }],
    ['helpCmd', {
        name: 'help',
        description: 'Display help info for non-game commands, game commands, or both',
        usage: `help <optional ${GameHelpOption}|${NonGameHelpOption}> (no option defaults to all)`,
        action: displayHelp
    }]
]);

bot.on('ready', () => {
    console.log('Ready');
    
    setupCommands();
    
    console.log("Servers:");
    bot.guilds.forEach((guild) => {
        console.log(" - " + guild.name + " - " + guild.id);

        const settings = bot.settings.ensure(guild.id, defaultSettings);
        
        if (!settings.game_channel_id) {
            setCmdChannelByName(guild, settings.game_channel_name);
        }
    });
});

bot.on('message', async message => {
    if(!message.guild || message.author.bot) return;
    
    const guild = message.guild;
    const guildConfig = bot.settings.ensure(guild.id, defaultSettings);
    let prefixUsed = null;
    
    if(message.content.startsWith(guildConfig.prefix)) {
        prefixUsed = guildConfig.prefix;
    } else if(message.content.startsWith(hardCodedPrefix)) {
        prefixUsed = hardCodedPrefix;
    }
    
    if(!prefixUsed) return;
    
    const commandArgs = message.content.slice(prefixUsed.length).split(/ +/);
    const commandName = commandArgs.shift().toLowerCase();
    
    if (commandName.length < 2) {
        return;
    }
    
    const nonGameCommand = NonGameCommands.find(c => c.name.startsWith(commandName));    
    if (nonGameCommand) {
        nonGameCommand.action(message, commandArgs);
        return;
    }
    
    if (!guildConfig.game_channel_id) {
        message.reply(`Command channel not setup (or default could not be found). Use ${guildConfig.prefix}setChannel <channel name or ID> to set a channel.`);
        return;
    }
    
    if(message.channel.id !== guildConfig.game_channel_id) return;
    
    const command = bot.commands.find(c => c.name.startsWith(commandName));
    if(command && command.action) {
        let game = games.get(guild.id);
            
        if (commandName === 'play') {
            if (!game) {
                game = new Game(guild, bot.settings.ensure(guild.id, defaultSettings));
                games.set(guild.id, game);
            }
            
            game[command.action](commandArgs.join(' '), message);
        } else if (game) {
            game[command.action](message.author, commandArgs.join(' '));
        }
    } else {
        message.reply(`Unknown command ${guildConfig.prefix}${commandName}. Use !help to see available commands`);
    }
});

function setupCommands() {
    for(var i = 0; i < Game.Commands.length; i++) {
        bot.commands.set(Game.Commands[i].name, Game.Commands[i]);
    }
    
    // NonGameCommands.forEach(c => bot.commands.set(c.name, c));
}

function setPrefixCharacter(message, prefixArg) {
    if (prefixArg === null || 
        prefixArg === undefined ||
        prefixArg.length === 0 ||
        prefixArg[0] === null || 
        prefixArg[0] === undefined ||
        prefixArg[0].length <= 0) {
        message.reply('You must provide a character(s) when setting the command prefix for Secret Hitler Bot');
    }
    
    bot.settings.ensure(message.guild.id, defaultSettings);
    bot.settings.setProp(message.guild.id, 'prefix', prefixArg[0]);
    
    message.reply(`Command prefix now set to '${bot.settings.getProp(message.guild.id, 'prefix')}' for Secret Hitler Bot`);
}

function setCmdChannel(message, channelArgsArray) {
    let game = games.get(message.guild.id);
    if (game && game.gameRunning) {
        messaage.reply("A game is currently running and the current game channel can't be changed. Try changing the channel once the game has ended.");
        return;
    }
    
    if (!channelArgsArray || channelArgsArray.length === 0) {
        message.reply('You must provide either a channel name or ID when setting the game text channel for Secret Hitler Bot');
    }
    
    const channelArg = channelArgsArray.join(' ');
    
    let channel = setCmdChannelById(message.guild, channelArg);
    
    if (!channel) {
        channel = setCmdChannelByName(message.guild, channelArg);
    }
    
    if (!channel) {
        message.reply(`Could not find channel either by name or ID for ${channelArg}`);
        return;
    }
    
    message.reply(`Game command channel set to ${channel.name} for Secret Hitler Bot`);
}

function toggleBoardVisuals(message) {    
    const settings = bot.settings.ensure(message.guild.id, defaultSettings);    
    bot.settings.setProp(message.guild.id, 'board_visuals', !settings.board_visuals);
    
    let game = games.get(message.guild.id);
    if (game) {
        game.toggleFullBoardVisuals();
    }
    
    const msg = settings.board_visuals ? 'Gameboard visuals are now being displayed' : 'Gameboard visuals will no longer be displayed';
    message.reply(msg);
}

function displayGuildConfig(message) {
    const guildConfig = bot.settings.ensure(message.guild.id, defaultSettings);
    
    const configProps = Object.keys(guildConfig).map(prop => {
        return `${prop}  :  ${guildConfig[prop]}\n`;
    });
    
    message.reply(`The following are the server's current configuration: ${configProps}`);
}

function resetGuildConfig(message) {
    bot.settings.set(message.guild.id, defaultSettings);
    
    message.reply('The configuration settings have been reset. Use !settings to view the current settings.');
}

function displayHelp(message, helpArgs) {
    const guildConfig = bot.settings.ensure(message.guild.id, defaultSettings);
    let displayNonGameHelp = true;
    let displayGameHelp = true;
    
    if (helpArgs.length > 0) {
        if (helpArgs[0] === NonGameHelpOption) {
            displayGameHelp = false;
        } else if (helpArgs[0] === GameHelpOption) {
            displayNonGameHelp = false;
        }
    }
    
    try {   
        const nonGameCmdHelpEmbed = createEmbedHelpMessage(message.guild, true);
        const gameCmdHelpEmbed = createEmbedHelpMessage(message.guild, false);        
        
        message.reply('A DM has been sent with the help info');
        
        if (displayNonGameHelp) {
            message.author.send(nonGameCmdHelpEmbed);
        }
        
        if (displayGameHelp) {
            message.author.send(gameCmdHelpEmbed);
        }
    } catch(e) {
        console.error('Error display help', e);
    }
}

function setCmdChannelById(guild, channelId) {
    const channel = guild.channels.get(channelId);
    
    if (channel) {
        const settings = bot.settings.ensure(guild.id, defaultSettings);
        if (settings.game_channel_name !== channel.name) {
            bot.settings.setProp(guild.id, 'game_channel_name', channel.name);
        }
        
        bot.settings.setProp(guild.id, 'game_channel_id', channel.id);
    }
    
    return channel;
}

function setCmdChannelByName(guild, channelName) {
    const channel = guild.channels.find(c => c.name === channelName);
    
    if (channel) {
        const settings = bot.settings.ensure(guild.id, defaultSettings);
        if (settings.game_channel_name !== channelName) {
            bot.settings.setProp(guild.id, 'game_channel_name', channelName);
        }
        
        bot.settings.setProp(guild.id, 'game_channel_id', channel.id);
    }
    
    return channel;
}

function createEmbedHelpMessage(guild, nonGameCommands) {
    const guildConfig = bot.settings.ensure(guild.id, defaultSettings);
    const nonGameNote = '**Note:** All commands can be reduced to at least 2 letters.';
    const gameNote = '**Note:** All commands can be reduced to at least 2 letters and players can either be identified via a callout @<user> or thier user/nickname (partials are okay).';
    let description = nonGameCommands ? 
        `${nonGameNote}\n\nThe following non-game commands are available:` : 
        `The rules can be found here [Secret Hitler Rules PDF](https://secrethitler.com/assets/Secret_Hitler_Rules.pdf)\n\n${gameNote}\n\nThe following game commands are available:`;
    
    const embed = new Discord.RichEmbed()
        .setTitle('Secret Hitler Bot Help Information')
        .setDescription(description)
        .setFooter(`The command prefix ${hardCodedPrefix} will always be available if necessary.`)
        .setTimestamp();
    
    const commands = nonGameCommands ? NonGameCommands : bot.commands;
    
    commands.forEach(c => {
        embed.addField(`${guildConfig.prefix}${c.usage}`, c.description);
    });
    
    return embed;
}

process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

bot.login(token);