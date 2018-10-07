'use strict';

import Discord from 'discord.js';
import Enmap from 'enmap';
import Game from './game.js';

const { defaultSettings, token, cmd_channel, hardCodedPrefix } = require('./config.json');
const bot = new Discord.Client();

let cmdChannel = null;
let games = new Discord.Collection();

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
        description: 'Display help info',
        usage: 'help',
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
        
        if (!settings.gameCmdChannelId) {
            setCmdChannelByName(guild, settings.gameCmdChannelName);
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
    
    if (!guildConfig.gameCmdChannelId) {
        message.reply(`Command channel not setup (or default could not be found). Use ${guildConfig.prefix}setChannel <channel name or ID> to set a channel.`);
        return;
    }
    
    if(message.channel.id !== guildConfig.gameCmdChannelId) return;
    
    const command = bot.commands.find(c => c.name.startsWith(commandName));
    if(command && command.action) {
        let game = games.get(guild.id);
            
        if (!game) {
            game = new Game(guild, bot.settings.getProp(guild.id, 'gameCmdChannelId'));
            games.set(guild.id, game);
        }
        
        if (commandName === 'play') {
            game[command.action](commandArgs.join(' '), message);
        } else {
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
    
    NonGameCommands.forEach(c => bot.commands.set(c.name, c));
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

function displayHelp(message) {
    const guildConfig = bot.settings.ensure(message.guild.id, defaultSettings);
    
    try {
        let helpDisplay = bot.commands.map(c => `\n${c.name} - ${c.description}\n    Usage: ${guildConfig.prefix}${c.usage}\n`);        
        helpDisplay.unshift('The following commands are available:\n');
        helpDisplay.push(`\nNote: The prefix ${hardCodedPrefix} can be used as a back-up if necessary.`);
        message.reply(helpDisplay.join(''));
    } catch(e) {
        console.error('Error display help', e);
    }
}

function setCmdChannelById(guild, channelId) {
    const channel = guild.channels.get(channelId);
    
    if (channel) {
        const settings = bot.settings.ensure(guild.id, defaultSettings);
        if (settings.gameCmdChannelName !== channel.name) {
            bot.settings.setProp(guild.id, 'gameCmdChannelName', channel.name);
        }
        
        bot.settings.setProp(guild.id, 'gameCmdChannelId', channel.id);
    }
    
    return channel;
}

function setCmdChannelByName(guild, channelName) {
    const channel = guild.channels.find(c => c.name === channelName);
    
    if (channel) {
        const settings = bot.settings.ensure(guild.id, defaultSettings);
        if (settings.gameCmdChannelName !== channelName) {
            bot.settings.setProp(guild.id, 'gameCmdChannelName', channelName);
        }
        
        bot.settings.setProp(guild.id, 'gameCmdChannelId', channel.id);
    }
    
    return channel;
}

process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

bot.login(token);