'use strict';

import Gameboard from './gameboard.js';
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
};

const extractUserId = function extractUserId(callout) {
    return callout.replace(/[<@!>]/g, '');
};

class Game {
    constructor(client) {
        this.client = client;
        this.gameState = null;
        this.deck = [];
        this.membershipDeck = [];
        this.discardPile = [];
        this.gameBoard = null;
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
        this.gameRunning = false;
        this.drawnPolicies = [];
        this.gameChannel = null;
        this.doesHitlerKnowFacists = false;
        this.previousPresidentIndex = null;
        this.speciallyElectedPresident = false;
        this.chancellorRequestedVeto = false;
        this.votes = { count: 0 };
        this.investigatedPlayers = [];
        
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
            msg += `${i+1} - ${this.drawnPolicies[i]}\n`;
        }
        
        msg += '\n\nPlease use !discard <card#> in the channel to discard your choice. The rest will be passed to the elected Chancellor';
        
        return msg;
    }
    
    getPeekPolicyInfo() {
        let msg = 'The following are the top 3 policies:\n\n';
        
        for (var i = 0; i < 3; i++) {
            msg += `${this.deck[i]}\n`;
        }
        
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
        if (isNaN(policyNumber) || policyNumber < 1 || policyNumber > this.drawnPolicies.length) {
            this.sendMessageLine(`${policy} is not a valid discard option`);
            return null;
        }
        
        return policyNumber;
    }
    
    checkState(expected) {
        return this.gameState === expected;
    }
    
    setState(state) {
        this.gameState = state;
    }
    
    createGameboard() {
        log('Creating gameboard...');
        this.gameBoard = new Gameboard(this.players.length);
    }
    
    createMemberships() {
        log('Creating membership decks...');
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
        log('Creating policy deck...');
        for (var i = 0; i < FacistPolicies; i++) {
            this.deck.push(Game.Policies.Facist);
        }

        for (var i = 0; i < LiberalPolicies; i++) {
            this.deck.push(Game.Policies.Liberal);
        }

        this.shuffleDeck();
        
        log('Shuffling policy deck...');
        log(this.deck);
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
        log('Assigning memberships...');
        
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
        
        this.sendMessageLine('Dealing party/role cards...\nPlease check your DM for your party and role assignement!\n');
    }
    
    assignRandomPresident() {        
        log('Assigning random president...');
        if (!this.checkState(Game.GameStates.AssignPresident)) return;
        
        this.presidentIndex = getRandomInt(this.players.length);
        this.president = this.players[this.presidentIndex];
        this.channcelorIndex = null;
        this.chancellor =  null;
        
        this.sendMessageLine(`${this.president.nickname} will start as the President`);
        this.setState(Game.GameStates.NominateChancellor);
    }
    
    assignNextPresident(player) {
        log('Assigning president...');
        if (!this.checkState(Game.GameStates.AssignPresident)) return;
        let notice = '';
        
        if (this.previousPresidentIndex && this.speciallyElectedPresident) {
            notice += `Returning to previous president order prior to the Special Election...\n`;
            this.presidentIndex = this.previousPresidentIndex;
            this.previousPresidentIndex = null;
            this.speciallyElectedPresident = false;
        }
        
        this.previousGovernment = [];
        this.previousGovernment.push(this.president.id);
        
        if (this.chancellor) {
            this.previousGovernment.push(this.chancellor.id);
            this.chancellor.resetAllowances();
        }
        
        this.president.resetAllowances();
        
        this.channcelorIndex = null;
        this.chancellor = null;
        this.chancellorRequestedVeto = false;
        
        if (player) { // specially elected
            this.speciallyElectedPresident = true;
            this.previousPresidentIndex = this.presidentIndex;
            this.president = player;
        } else { 
            this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
            
            while(this.players[this.presidentIndex].isDead) {
                this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
            }
        
            this.president = this.players[this.presidentIndex];
        }        
        
        notice += `${this.president.nickname} is now the President`;
        this.sendMessageLine(notice);
        this.setState(Game.GameStates.NominateChancellor);
    }
    
    nominateChancellor(author, nominated) {
        log('Nominating chancellor...');
        
        if (!this.checkState(Game.GameStates.NominateChancellor)) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayer(extractUserId(nominated));
            
            if (!player) return;
            
            const wasInPrevGovt = this.previousGovernment.find(id => id === player.id);
            
            if (player.isDead) {
                this.sendMessageLine(`${player.nickname} is dead and cannot be nominated as Chancellor`);
                return;
            } else if (wasInPrevGovt) {
                this.sendMessageLine(`${player.nickname} was part of the previous government and cannot be nominated as Chancellor`);
                return;
            }
            
            this.sendMessageLine(`${this.president.nickname} has nominated ${player.nickname} as Chancellor\n. Everyone should now vote using !vote <ja|nein>...`);
            this.nominatedChancellor = player;
            this.setState(Game.GameStates.VoteOnNomination);
        }
    }

    voteOnNomination(author, vote) {
        if (!this.checkState(Game.GameStates.VoteOnNomination)) return;
        
        vote = vote.toLowerCase();        
        const player = this.findPlayer(author.id);
        if (this.nominatedChancellor && player && !this.votes[player.id]) {
            log('vote: '+ vote);
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
                log(this.votes);
                for(var i = 0; i < this.players.length; i++) {
                    if (this.votes[this.players[i].id] === 1) {
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
                    this.electChancellor();
                } else {
                    msg += 'The NEINs have it\n\n';
                    this.sendMessageLine(msg);
                    this.rejectNomination();
                }
            }
        }
    }
    
    electChancellor() {
        this.chancellor = this.nominatedChancellor;
        this.nominatedChancellor = null;
        this.sendMessageLine(`${this.chancellor.nickname} has been elected chancellor.`);
        this.setState(Game.GameStates.PresidentDrawPolicies);
        
        if (this.doFacistsWin()) {
            this.gameRunning = false;
            this.setState(Game.GameStates.Finished);
        }
    }
    
    rejectNomination() {
        this.gameBoard.increaseElectionTracker();
        const msg = `${this.nominatedChancellor.nickname} was not elected chancellor.\nRejected Election Tracker: ${this.gameBoard.NumOfRejectedGovts}`
                
        this.sendMessageLine(msg);
        this.nominatedChancellor = null;
        this.chancellor = null;
        
        if (this.gameBoard.NumOfRejectedGovts >= 3) {
            this.enactTopPolicy();
        }
        
        this.setState(Game.GameStates.AssignPresident);
        this.assignNextPresident();
    }
    
    enactTopPolicy() {
        this.enactPolicy(this.deck.pop());
    }
    
    drawPolicies(author) {
        if (!this.checkState(Game.GameStates.PresidentDrawPolicies)) return;
        
        const player = this.findPlayer(author.id);
        
        if (player.id === this.president.id) {
            if (this.deck.length < 3) {
                this.shuffleAndAddDiscardPile();
            }
        
            this.drawnPolicies = this.deck.slice(0, 3);            
            player.user.send(this.getDrawnPolicyInfo());
            this.setState(Game.GameStates.PresidentDiscardPolicy);
        }
    }
    
    discardPolicy(author, policy) {        
        const player = this.findPlayer(author.id);
        
        if (!this.checkState(Game.GameStates.PresidentDiscardPolicy) && !this.checkState(Game.GameStates.ChancellorDiscardPolicy)) return;
        if (this.checkState(Game.GameStates.PresidentDiscardPolicy) && player.id !== this.president.id) return;
        if (this.checkState(Game.GameStates.ChancellorDiscardPolicy) && player.id !== this.chancellor.id) return;
        
        const policyNumber = this.validatePolicyNumber(policy);
        if (!policyNumber) return;
        
        const discardedPolicies = this.drawnPolicies.splice((policyNumber - 1), 1);
        this.discardPile = this.discardPile.concat(discardedPolicies);
        
        if (this.checkState(Game.GameStates.PresidentDiscardPolicy)) {
            this.handOverToChancellor();
        } else if (this.checkState(Game.GameStates.ChancellorDiscardPolicy)) {
            if (this.drawnPolicies.length > 1) {
                log('More than one policy left after Chancellor discarded');
                log(this.drawnPolicies);
            } else if (this.drawnPolicies.length === 0) {
                log('No policies left after chancellor discarded!');
            }
            
            this.enactPolicy(this.drawnPolicies[0]);
        }        
    }
    
    handOverToChancellor() {        
        this.chancellor.user.send(this.getDrawnPolicyInfo());
        this.setState(Game.GameStates.ChancellorDiscardPolicy);
    }
    
    vetoPolicies(author) {
        if (!checkState(Game.GameStates.ChancellorDiscardPolicy)) return;
        if (this.chancellorRequestedVeto) return;
        
        const player = this.findPlayer(author.id);
        if (player.id === this.chancellor.id) {
            this.chancellorRequestedVeto = true;
            this.sendMessageLine(`Chancellor ${this.chancellor.nickname} has requested a veto of the current policies. President ${this.president.nickname} can either consent or reject using !consent <ja|nein>`);        
            this.setState(Game.GameStates.ChancellorVetoRequested);
        }
    }
    
    consentVetoRequest(author, consent) {
        if (!checkState(Game.GameStates.ChancellorVetoRequested)) return;
        
        consent = consent.toLowerCase();
        const player = this.findPlayer(author.id);
        if (player.id === this.president.id) {
            if (consent === 'nein' || consent === 'n' || consent === 'no') {
                this.setState(Game.GameStates.ChancellorDiscardPolicy);
            } else if (consent === 'ja' || consent === 'j' || consent === 'y' || consent === 'yes') {
                this.gameBoard.increaseElectionTracker();
                this.setState(Game.GameStates.AssignPresident);
                this.assignNextPresident();
            } else {
                return;
            }
        }
    }
    
    enactPolicy(policy) {
        this.gameBoard.resetElectionTracker();
        
        if (policy === Game.Policies.Facist) {
            this.gameBoard.enactFacistPolicy();
        } else {
            this.gameBoard.enactLiberalPolicy();
        }
        
        this.sendMessageLine(this.gameBoard.getGameboardDisplay());
        
        log('checking win conditions...');
        if (this.doFacistsWin() || this.doLiberalsWin()) {
            this.gameRunning = false;
            this.setState(Game.GameStates.Finished);
            return;
        }
        
        log('checking exec actions...');
        const executiveAction = this.gameBoard.getUnlockedExecutionAction();
        if (executiveAction != Gameboard.PresidentialPowers.None) {
            this.handleExecutiveAction(executiveAction);
        } else {
            this.setState(Game.GameStates.AssignPresident);
            this.assignNextPresident();
        }
    }
    
    handleExecutiveAction(executiveAction) {
        log(`handling exec action: ${executiveAction}`);
        if (executiveAction === Gameboard.PresidentialPowers.PolicyPeek) {
            this.setState(Game.GameStates.PresidentPolicyPeek);
            this.executePolicyPeek();
        } else if (executiveAction === Gameboard.PresidentialPowers.InvestigateLoyalty) {
            this.setState(Game.GameStates.PresidentInvestigateLoyalty);
            this.startLoyaltyInvestigation();
        } else if (executiveAction === Gameboard.PresidentialPowers.SpecialElection) {
            this.setState(Game.GameStates.PresidentSpecialElection);
            this.startSpecialElection();
        } else if (executiveAction === Gameboard.PresidentialPowers.Execution) {
            this.setState(Game.GameStates.PresidentExecution);
            this.startExecution();
        } else {
            log(`Unknown presidential power: ${executiveAction}`);
        }
    }
    
    executePolicyPeek() {
        this.sendMessageLine(`The Policy Peek Executive Action has been unlocked.\nSending President ${this.president.nickname} the top 3 policies...`);
        
        if (this.deck.length < 3) {
            this.shuffleAndAddDiscardPile();
        }
        
        this.president.user.send(this.getPeekPolicyInfo());
        
        this.setState(Game.GameStates.AssignPresident);
        this.assignNextPresident();
    }
    
    startLoyaltyInvestigation() {
        this.sendMessageLine(`The Investigate Loyalty Executive Action has been unlocked.\nPresident ${this.president.nickname} can investigate a single player's party membership using !investigate <player>...`);        
        this.setState(Game.GameStates.PresidentInvestigatePlayer);
    }
    
    investigatePlayer(author, user) {
        if (!this.checkState(Game.GameStates.PresidentInvestigatePlayer)) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayer(extractUserId(user));
            const hasBeenInvestigated = this.investigatedPlayers.find(p => p.id === player.id);
            
            if (hasBeenInvestigated) {
                this.sendMessageLine(`${player.nickname} has already been investigated and cannot be investigated twice in a game`);
                return;
            } else if (player.isDead) {
                this.sendMessageLine(`${player.nickname} is dead and cannot be investigated`); // This should never be possible since execution come AFTER investigations
                return;
            }
            
            this.president.user.send(player.getPartyMembershipInfo());
            this.investigatedPlayers.push(player.id);
            this.setState(Game.GameStates.AssignPresident);
            this.assignNextPresident();
        }
    }
    
    startSpecialElection() {
        this.sendMessageLine(`The Special Election Executive Action has been unlocked.\nPresident ${this.president.nickname} can elect the next president using !elect <player>...`);        
        this.setState(Game.GameStates.SpeciallyElectPresident);
    }
    
    speciallyElectPresident(author, newPres) {
        if (!this.checkState(Game.GameStates.SpeciallyElectPresident)) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayer(extractUserId(newPres));
            
            if (player.isDead) {
                this.sendMessageLine(`${player.nickname} is dead and cannot be chosen as President`);
                return;
            }
            
            this.setState(Game.GameStates.AssignPresident);
            this.assignNextPresident();
        }
    }
    
    startExecution() {
        this.sendMessageLine(`The Execution Executive Action has been unlocked.\nPresident ${this.president.nickname} can choose a single player to execute using !shoot <player>...`);        
        this.setState(Game.GameStates.PresidentShootPlayer);
    }
    
    shootPlayer(author, user) {
        if (!this.checkState(Game.GameStates.PresidentShootPlayer)) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayer(extractUserId(user));
            
            if (player.isDead) {
                this.sendMessageLine(`${player.nickname} has already been executed and cannot be made more dead`);
                return;
            } else {
                player.isDead = true;
            }
            
            if (this.doLiberalsWin()) {
                this.gameRunning = false;
                this.setState(Game.GameStates.Finished);
            } else {
                this.sendMessageLine('Hitler was not shot. Game continues.');
                this.setState(Game.GameStates.AssignPresident);
                this.assignNextPresident();
            }
        }
    }
    
    doFacistsWin() {
        if (this.gameBoard.NumOfFacistPolicies == 6) {
            const msg = `6 Facist policies enacted!\n{this.hitler.nickname} and his facists win!`;
            this.sendMessageLine(msg);
            return true;
        }

        if (this.gameBoard.NumOfFacistPolicies >= 3 && this.channcelor.isHitler) {
            const msg = `{this.channcelor.nickname} is Hitler!\n{this.hitler.nickname} and his facists win!`;
            this.sendMessageLine(msg);
            return true;
        }
        
        return false;
    }
    
    doLiberalsWin() {
        if (this.gameBoard.NumOfLiberalPolicies == 5) {
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
        log('Finding players...');
        
        let foundPlayers = [];
        
        if (!players) {
            foundPlayers = this.getAllUsersInAuthorsChannel(author);
        } else {
            const playersArray = players.split(" ");
            const playerIds = playersArray.map(u => extractUserId(u));
            foundPlayers = this.getUsersFromIds(playerIds);
        }
        
        let notice = '';        
        if (foundPlayers.length > 10) {
            notice += 'Found more than 10 possible players, using the first 10 found.\n';
            foundPlayers = foundPlayers.slice(0, 10);
        }
        
        for(var i = 0; i < foundPlayers.length; i++) {
            this.players.push(new Player(foundPlayers[i]));
        }
        
        this.doesHitlerKnowFacists = this.players.length <= 6;
        
        notice += 'The following users are now playing:\n';
        
        for(var i = 0; i < this.players.length; i++) {
            notice += `${this.players[i].nickname}\n`;
        }
        
        this.sendMessageLine(notice);
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
        
        this.gameRunning = true;
        this.setState(Game.GameStates.Setup);
        this.sendMessageLine('Starting a new game of Secret Hitler!\n--------------------------------------\n');
        
        this.findUsersPlaying(message.author, players);
        
        this.createGameboard();
        this.createMemberships();
        this.createDeck();
        this.shufflePlayerOrder();        
        this.assignMemberships();
    
        this.setState(Game.GameStates.AssignPresident);
        this.assignRandomPresident();
    }
    
    showGameStateInfo() {
        let info = 'Current Game State:\n';
        info += '---------------------\n\n';
        info += this.gameBoard.getGameboardDisplay();
        info += `Policy cards left: ${this.deck.length}\n\n`;
        
        info += `President: ${this.president.nickname}\n`;
        info += `Chancellor: ${this.chancellor ? this.chancellor.nickname : 'None'}\n\n`;
        
        if (this.players.some(p => p.isDead)) {
            info += 'Players dead:\n';
            const deadPlayers = this.players.map(p => p.isDead ? p.nickname : '');
            info += deadPlayers.join('\n');
        } else {
            info += 'No players dead';
        }
        
        this.sendMessageLine(info);
    }
    
    static get Commands() {
        return [
            {
                name: 'play',
                alias: 'start',
                description: 'Starts a new game',
                usage: '!play <optional list of players>',
                example: '!play or !play @Squid#3288, @vagen#5010',
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
                name: 'elect',
                description: 'Elects a specially elected president (when applicable)',
                usage: '!elect <player>',
                example: '!nominate @Squid#3288',
                action: 'speciallyElectPresident'
            },
            {
                name: 'shoot',
                description: 'Shoots the specified player (when applicable)',
                usage: '!shoot <player>',
                example: '!shoot @Squid#3288',
                action: 'shootPlayer'            
            },
            {
                name: 'veto',
                description: 'Initates a veto of the current policies (when applicable)',
                usage: '!veto',
                action: 'vetoPolicies'            
            },
            {
                name: 'consent',
                description: 'Consents or denies to a requested veto (when applicable)',
                usage: '!consent <ja|nein>',
                action: 'consentVetoRequest'            
            },
            {
                name: 'info',
                description: 'Displays the status of enacted policies, number of policy cards left, current Election Tracker status, current government, and any dead players',
                usage: '!info',
                action: 'showGameStateInfo'            
            },
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
            PresidentPolicyPeek: 7,
            PresidentInvestigateLoyalty: 8,
            PresidentSpecialElection: 9,
            PresidentShootPlayer: 10,
            SpeciallyElectPresident: 11, 
            PresidentInvestigatePlayer: 12,
            PresidentExecution: 13,
            ChancellorVetoRequested: 14,
            Finished: 15
        };
    }
    
    static get Policies() {
        return {
            Facist: 'Facist',
            Liberal: 'Liberal'
        };
    }
}

export default Game;