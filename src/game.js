'use strict';

import Player from './player.js';
import Membership from './membership.js';
const { cmd_channel } = require('./config.json');

const FacistPolicies = 11;
const LiberalPolicies = 7;
const MaxPlayers = 10;

const shuffle = function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }

    return a;
};

const getRandomInt = function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
};

const log = function log(msg) {
    console.log(msg);
}

class Game {
    constructor(client) {
        this.client = client;
        this.gameState = null;
        this.deck = [];
        this.membershipDeck = [];
        this.discardPile = [];
        this.players = [];
        this.president = null;
        this.presidentIndex = -1;
        this.nominatedChancellor = null;
        this.channcelor = null;
        this.channcelorIndex = null;
        this.liberals = [];
        this.facists = [];
        this.hitler = null;
        this.previousGovernment = [];
        this.govtRejectCount = 0;
        this.facistPolices = 0;
        this.liberalPolices = 0;
        this.gameRunning = false;
        this.drawnPolicies = [];
        this.gameChannel = null;
        this.doesHitlerKnowFacists = false;
        this.votes = { count: 0 };
        
        if (this.client) {
            this.gameChannel = this.client.channels.get(cmd_channel);
        } else {
            log('Client object not provided - cannot initialize');
        }
    }
    
    sendMessageLine(msg) {
        this.sendMessage(msg + '\n');
    }
    
    sendMessage(msg) {
        if (!this.gameChannel) {
            if (!this.client) { 
                log('Cannot get game channel when sending message - no client object');
                return;
            }
            
            this.gameChannel = this.client.channels.get(cmd_channel);
        }
        
        this.gameChannel.send(msg);
    }
    
    findPlayer(id) {
        return this.players.find(p => p.id === id);
    }
    
    getDrawnPolicyInfo() {
        let msg = 'You have the following policy options:\n\n';
        
        for (var i = 0; i < this.drawnPolicies.length; i++) {
            msg += `${i+1} - ${this.drawPolicies[i]}\n`;
        }
        
        msg += '\n\nPlease use !discard <card#> in the channel to discard your choice. The rest will be passed to the elected Chancellor';
        
        return msg;
    }
    
    getUsersFromIds(playerIds) {
        let users = [];
        for(var i = 0; i < playerIds.length; i++) {
            const user = this.client.users.get(playerIds[i]);
            
            if (!user) continue;
            
            users.push(user);
        }
        
        return users;
    }
    
    getAllUsersInAuthorsChannel(author) {
        var voiceChannelId = author.lastMessage.member.voiceChannelID;
        var voiceChannel = this.client.channels.get(voiceChannelId);
        return voiceChannel.members.map(u => u);
        
        /*const mem = vc.members.map(x => x.nickname);    
        mem.unshift('Members:\n');
        mem.join('');*/
    }
    
    validatePolicyNumber(policy) {
        const policyNumber = parseInt(policy, 10);
        if (isNaN(policyNumber) || policyNumber < 1 || policyNumber > this.drawPolicies.length) {
            this.sendMessageLine(`${policy} is not a valid discard option`);
            return null;
        }
        
        return policyNumber;
    }
    
    createMemberships() {
        let numOfFacists = 2;
        if (this.players.length > 6 && this.players.length < 9) {
            numOfFacists = 3;
        } else if (this.players.length >= 9) {
            numOfFacists = 4;
        }
        
        this.addFacistMemberships(numOfFacists);
        this.addLiberalMemberships(this.players.length - numOfFacists);
        this.membershipDeck = shuffle(this.membershipDeck);
        
        log('Shuffling party/role cards...');
    }
    
    addFacistMemberships(numOfFacists) {
        for(var i = 0; i < (numOfFacists - 1); i++) {
            this.membershipDeck.push(Membership.CreateFacist());
        }
        
        this.membershipDeck.push(Membership.CreateHitler());
    }
    
    addLiberalMemberships(numOfLiberals) {
        for(var i = 0; i < numOfLiberals; i++) {
            this.membershipDeck.push(Membership.CreateLiberal());
        }
    }
    
    createDeck() {
        for (var i = 0; i < FacistPolicies; i++) {
            this.deck.push('F');
        }

        for (var i = 0; i < LiberalPolicies; i++) {
            this.deck.push('L');
        }

        this.shuffleDeck();
        
        log('Shuffling policy deck...');
    }

    shuffleDeck() {
        this.deck = shuffle(this.deck);
    }
    
    shufflePlayerOrder() {
        this.players = shuffle(this.players);
    }
    
    shuffleAndAddDiscardPile() {
        log('Shuffling discard pile back into deck...');
        this.discardPile = shuffle(this.discardPile);
        this.deck = this.deck.concat(this.discardPile);
        this.discardPile = [];
    }
    
    assignMemberships() {
        this.sendMessageLine('Dealing party/role cards...');
        
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].assignMembership(this.membershipDeck.pop());
        }
        
        for(var i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            
            if (player.isFacist && !player.isHitler) {
                this.facists.push(player);
            } else {
                this.liberals.push(player);
            }
            
            if (player.isHitler) {
                this.hitler = player;
            }
        }
        
        for(var i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            player.user.send(player.getFullMembershipInfo(this.hitler, this.facists, this.doesHitlerKnowFacists));
        }        
        
        this.sendMessageLine('Please check your DM for your party and role assignement!\n');
    }
    
    assignRandomPresident() {
        if (this.gameState != Game.GameStates.AssignPresident) return;
        
        this.presidentIndex = getRandomInt(this.players.length);
        this.president = this.players[this.president];
        this.channcelorIndex = null;
        this.chancellor =  null;
        
        this.sendMessageLine(`${this.president.nickname} will start as the President`);
        this.gameState = Game.GameStates.NominateChancellor;
    }
    
    assignNextPresident() {
        if (this.gameState != Game.GameStates.AssignPresident) return;
        this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
        
        this.president.resetAllowances();
        this.chancellor.resetAllowances();
        
        this.president = this.players[this.president];
        this.channcelorIndex = null;
        this.chancellor = null;
        
        this.sendMessageLine(`${this.president.nickname} is now the President`);
        this.gameState = Game.GameStates.NominateChancellor;
    }
    
    nominateChancellor(author, nominated) {
        if (this.gameState != Game.GameStates.NominateChancellor) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayer(nominated.id);
            this.sendMessageLine(`${this.president.nickname} has nominated ${} as Chancellor`);
            this.nominatedChancellor = player;
            this.gameState = Game.GameStates.VoteOnNomination;
        }
    }

    voteOnNomination(author, vote) {
        if (this.gameState != Game.GameStates.VoteOnNomination) return;
        
        vote = vote.toLowerCase();        
        const player = this.findPlayer(author.id);
        if (this.nominatedChancellor && player && !this.votes[player.id]) {
            if (vote === 'nein' || vote === 'n' || vote === 'no') {
                this.votes[player.id] = 1;
            } else if (vote === 'ja' || vote === 'j' || vote === 'y' || vote === 'yes') {
                this.votes[player.id] = 2;
            } else {
                return;
            }
            
            this.votes.count++;
            
            let jas = 0;
            let neins = 0;
            
            if (this.votes.count === this.players.length) {
                for(var i = 0; i < this.players.length; i++) {
                    if (this.votes[player.id] === 1) {
                        neins++;
                    } else {
                        jas++;
                    }
                }
                
                let msg = 'Vote results: \n';
                msg += `JA:   ${jas}\n`;
                msg += `NEIN: ${neins}\n`;
                
                if (jas > neins) {
                    msg += 'The JAs have it\n\n';
                    this.sendMessageLine(msg);
                    electChancellor();
                } else {
                    msg += 'The NEINs have it\n\n';
                    this.sendMessageLine(msg);
                    rejectNomination();
                }
            }
        }
    }
    
    electChancellor() {
        this.chancellor = this.nominatedChancellor;
        this.nominatedChancellor = null;
        this.govtRejectCount = 0;
        this.sendMessageLine(`${this.chancellor.nickname} has been elected chancellor.`);
        this.gameState = Game.GameStates.PresidentDrawPolicies;
        
        if (doFacistsWin()) {
            this.gameRunning = false;
            this.gameState = Game.GameStates.Finished.
        }
    }
    
    rejectNomination() {
        this.govtRejectCount++;
        const msg = `${this.nominatedChancellor.nickname} was not elected chancellor.\nRejected Election Tracker: ${this.govtRejectCount}`
                
        this.sendMessageLine(msg);
        this.nominatedChancellor = null;
        this.chancellor = null;
        
        if (this.govtRejectCount >= 3) {
            this.enactTopPolicy();
        }
    }
    
    enactTopPolicy() {
    }
    
    drawPolicies(author) {
        if (this.gameState != Game.GameStates.PresidentDrawPolicies) return;
        
        const player = this.findPlayer(author.id);
        
        if (player.id === this.president.id && !player.hasDrawn) {
            if (this.deck.length < 3) {
                this.shuffleAndAddDiscardPile();
            }
        
            this.drawnPolicies = this.deck.slice(0, 3);            
            player.user.send(this.getDrawnPolicyInfo());
            player.hasDrawn = true;
            player.hasPoliciesToDiscard = true;
            this.gameState = Game.GameStates.PresidentDiscardPolicy;
        }
    }
    
    discardPolicy(author, policy) {        
        const player = this.findPlayer(author.id);
        
        if (this.gameState !== Game.GameStates.PresidentDiscardPolicy || this.gameState === Game.GameStates.ChancellorDiscardPolicy) return;
        if (this.gameState === Game.GameStates.PresidentDiscardPolicy && player.id !== this.president.id) return;
        if (this.gameState === Game.GameStates.ChancellorDiscardPolicy && player.id !== this.chancellor.id) return;
        
        const policyNumber = this.validatePolicyNumber(policy);
        if (!policyNumber) return;
        
        const discardedPolicies = this.drawnPolicies.splice((policyNumber - 1), 1);
        discardPile = discardPile.concat(discardedPolicies);
        
        if (this.gameState === Game.GameStates.PresidentDiscardPolicy) {
            this.handOverToChancellor();
        } else if (this.gameState === Game.GameStates.ChancellorDiscardPolicy) {
            this.enactPolicy();
        }        
    }
    
    handOverToChancellor() {
        this.president.hasPoliciesToDiscard = false;
        this.president.hasDiscarded = true;
        
        this.chancellor.user.send(this.getDrawnPolicyInfo());
        this.chancellor.hasPoliciesToDiscard = true;
        this.president.hasDiscarded = false;
        this.gameState = Game.GameStates.ChancellorDiscardPolicy;
    }
    
    enactPolicy() {
        this.channcelor.hasPoliciesToDiscard = false;
        this.channcelor.hasDiscarded = true;
        
        // put policy on board
        
        if (doFacistsWin() || doLiberalsWin()) {
            this.gameRunning = false;
            this.gameState = Game.GameStates.Finished;
            return;
        }
        
        // handle any board activated abilities
        
        this.gameState = Game.GameStates.AssignPresident;
        this.assignNextPresident();
    }
    
    shootPlayer(author, player) {
        if (this.gameState != Game.GameStates.PresidentShootPlayer) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayer(player.id);
            
            if (player) {
                player.isDead = true;
            }
            
            if (doLiberalsWin()) {
                this.gameRunning = false;
            } else {
                this.sendMessageLine('Hitler was not shot. Game continues.\n';
            }
        }
    }
    
    doFacistsWin() {
        if (this.facistPolices == 6) {
            const msg = `6 Facist policies enacted!\n{this.hitler.nickname} and his facists win!`;
            this.sendMessageLine(msg);
            return true;
        }

        if (this.facistPolices >= 3 && this.channcelor.isHitler) {
            const msg = `{this.channcelor.nickname} is Hitler!\n{this.hitler.nickname} and his facists win!`;
            this.sendMessageLine(msg);
            return true;
        }
        
        return false;
    }
    
    doLiberalsWin() {
        if (this.LiberalPolicies == 5) {
            const msg = `5 Liberal policies enacted!\nThe Liberals win!`;
            this.sendMessageLine(msg);
            return true;
        }
        
        if (this.hitler.isDead) {
            const msg = `Hitler (${this.hitler.nickname}) has been killed!\n The Liberals win!`;
            return true;
        }
        
        return false;
    }
    
    findUsersPlaying(author, players) {
        this.sendMessageLine('Finding players...');
        
        let foundPlayers = [];
        
        if (!players) {
            foundPlayers = this.getAllUsersInAuthorsChannel(author);
        } else {
            const playersArray = players.split(" ");
            const playerIds = playersArray.map(u => u.replace(/[<@!>]/g, ''));
            foundPlayers = this.getUsersFromIds(playerIds);
        }
        
        if (foundPlayers.length > 10) {
            this.sendMessageLine('Found more than 10 possible players, using the first 10 found.');
            foundPlayers = foundPlayers.slice(0, 10);
        }
        
        for(var i = 0; i < foundPlayers.length; i++) {
            this.players.push(new Player(foundPlayers[i]));
        }
        
        this.doesHitlerKnowFacists = this.players.length <= 6;
        
        this.sendMessageLine('The following users are now playing:');
        
        for(var i = 0; i < this.players.length; i++) {
            this.sendMessageLine(this.players[i].nickname);
        }
    }
    
    startGame(players, message) {
        if (!this.client) {
            message.channel.send('Game was not properly initialized!');
            return;
        }
        
        if (this.gameRunning) {
            this.sendMessageLine('A game of Secret Hitler is already running.');
            return;
        }
        
        this.gameState = Game.GameStates.Setup;
        this.sendMessageLine('Starting a new game of Secret Hitler!');
        this.sendMessageLine('--------------------------------------\n');
        
        this.findUsersPlaying(message.author, players);
        
        this.sendMessageLine('--------------------------------------\n');
        
        this.createMemberships();
        this.createDeck();
        this.shufflePlayerOrder();        
        this.assignMemberships();

        this.gameState = Game.GameStates.AssignPresident;
        this.assignRandomPresident();
    }
    
    static get Commands() {
        return [
            {
                name: 'play',
                alias: 'start',
                description: 'Starts a new game',
                usage: '!play <optional list of players>',
                example: '!play @Squid#3288, @vagen#5010',
                action: 'startGame'
            },
            {
                name: 'nominate',
                description: 'Nominate a player as chancellor',
                usage: '!nominate <player>',
                example: '!nominate @Squid#3288',
                action: 'nominateChancellor'            
            },
            {
                name: 'vote',
                description: 'Votes on the current election',
                usage: '!vote <ja,nein>',
                action: 'voteOnNomination'            
            },
            {
                name: 'draw',
                description: 'Draws three policy cards',
                usage: '!draw',
                action: 'drawPolicies'            
            },
            {
                name: 'discard',
                description: 'Discards the specified card',
                usage: '!discard <card # to discard>',
                usage: '!discard 1',
                action: 'discardPolicy'            
            },
            {
                name: 'veto',
                description: 'Initates a veto of the current policies (if allowed)',
                usage: '!veto',
                action: 'vetoPolicies'            
            },
            {
                name: 'info',
                description: 'Displays the status of enacted policies, number of policy cards left, and the current Election Tracker status',
                usage: '!info',
                action: 'showGameStateInfo'            
            },
            {
                name: 'shoot',
                description: 'Shoots the specified player (if allowed)',
                usage: '!shoot <player>',
                example: '!shoot @Squid#3288',
                action: 'shootPlayer'            
            }
        ];
    }
    
    static get GameStates() {
        return {
            Setup: 0,
            AssignPresident: 1,
            NominateChancellor: 2,
            VoteOnNomination: 3,
            PresidentDrawPolicies: 4,
            PresidentDiscardPolicy: 5,
            ChancellorDiscardPolicy: 6,
            PresidentShootPlayer: 7,
            Finished: 8
        };
    }
}

export default Game;