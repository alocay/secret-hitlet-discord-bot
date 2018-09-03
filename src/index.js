'use strict';

import Discord from 'discord.js';
import Game from './game.js';
const { prefix, token, cmd_channel } = require('./config.json');
const client = new Discord.Client();

let cmdChannel = null;
let game = new Game(client);

client.commands = new Discord.Collection();

client.on('ready', () => {
    console.log('Ready');
    
    if (!cmdChannel) {
        cmdChannel = client.channels.get(cmd_channel);
    }
    
    const helpCmd = {
        name: 'help',
        description: 'Display help info',
        usage: '!help',
        action: displayHelp
    };
    
    for(var i = 0; i < Game.Commands.length; i++) {
        client.commands.set(Game.Commands[i].name, Game.Commands[i]);
    }
    
    client.commands.set(helpCmd.name, helpCmd);
});

client.on('message', async message => {
    if(message.channel.id !== cmd_channel || message.author.bot || !message.content.startsWith(prefix)) return;
    
    const commandArgs = message.content.slice(prefix.length).split(/ +/);
    const commandName = commandArgs.shift().toLowerCase();
    const command = client.commands.get(commandName);
    
    if(command && command.action) {
        command.action(commandArgs.join(' '), message);
    } else {
        message.reply(`Unknown command ${prefix}${commandName}. Use !help to see available commands`);
    }
});

function displayHelp() {
    if(cmdChannel) {
        try {
            let helpDisplay = client.commands.map(c => `\n${c.name} - ${c.description}\n    Usage: ${c.usage}\n`);        
            helpDisplay.unshift('The following commands are available:\n');        
            cmdChannel.send(helpDisplay.join(''));
        } catch(e) {
            console.error('Error display help', e);
        }
    }
}

client.login(token);

process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));