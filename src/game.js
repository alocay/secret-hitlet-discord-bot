'use strict';

import Discord from 'discord.js';
import Gameboard from './gameboard.js';
import Player from './player.js';
import Membership from './membership.js';
import EmbeddedMessage from './message.js';

const FacistPolicies = 11;
const LiberalPolicies = 7;
const MaxPlayers = 10;
const MinPlayers = 5;

const FacistLogo = "https://i.imgur.com/njhfcwE.png";
const LiberalLogo = "https://i.imgur.com/5uBH2Qp.png";

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

const extractUserId = function extractUserId(callout) {
    return callout.replace(/[<@!>]/g, '');
};

const createEmbeddedMessage = function createEmbeddedMessage(message) {
    const embed = new Discord.RichEmbed()
        .setTitle(message.title)
        .setAuthor(message.author)
        .setDescription(message.description)
        .setColor(message.color)
        .setThumbnail(message.thumbnail)
        .setTimestamp();
    
    message.lines.forEach(l => {
        embed.addField(l.header, l.value)
    });
    
    return embed;
};

class Game {
    constructor(guild, settings) {
        this.guild = guild;
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
        this.facistsWon = false;
        this.liberalsWon = false;
        this.preEndConfirmState = null;
        this.gameChannelId = settings.game_channel_id;
        this.displayFullBoardVisuals = settings.board_visuals;
        
        if (this.guild) {
            this.gameChannel = this.guild.channels.get(settings.game-channel-id);
        } else {
            this.log('Client object not provided - cannot initialize');
        }
    }

	log(msg) {
		if (this.guild && !this.guild.isMock) {
			console.log(msg);
		}
	}
	
    toggleFullBoardVisuals() {
        this.displayFullBoardVisuals = !this.displayFullBoardVisuals;
    }
    
    sendMessageLine(msg) {
        this.sendMessage(msg + '\n');
    }
    
    sendMessage(msg) {
        if (!this.gameChannel) {
            if (!this.guild) { 
                this.log('Cannot get game channel when sending message - no client object');
                return;
            }
            
            this.gameChannel = this.guild.channels.get(this.gameChannelId);
        }
        
        this.gameChannel.send(msg);
    }
    
    sendGameboardEmbeds(facistBoard, liberalBoard, text) {
        if (!this.gameChannel) {
            if (!this.guild) { 
                this.log('Cannot get game channel when sending message - no client object');
                return;
            }
            
            this.gameChannel = this.guild.channels.get(this.gameChannelId);
        }
        
        // Send them one after the other
        const that = this;
        this.gameChannel.send(facistBoard)
            .then(msg => {
                that.gameChannel.send(liberalBoard)
                    .then(msg => {
                        that.gameChannel.send(text);
                });
        });
    }
    
    sendGameboardVisualDisplay() {
        const gameBoardElements = this.getVisualGameboardDisplay();
        const gameBoardText = this.gameBoard.getGameboardDisplay();
        
        if (!this.displayFullBoardVisuals || !gameBoardElements) {
            this.sendMessageLine(gameBoardText);
        } else {
            this.sendGameboardEmbeds(gameBoardElements[0], gameBoardElements[1], gameBoardText);
        }
    }
    
    findPlayer(id) {
        return this.players.find(p => p.id === id);
    }
    
    findPlayerByName(name) {
        return this.players.find(p => p.nickname.toLowerCase().incldues(name.toLowerCase()));
    }
    
    findPlayerByArg(playerArg) {
        if (playerArg.includes('@')) {
            return this.findPlayer(extractUserId(playerArg));
        } else {
            return this.findPlayerByName(playerArg);
        }
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
        
        const peekedPolicies = this.deck.slice(0, 3);
        if (this.guild.test_peekedPolicies) {
            this.guild.test_peekedPolicies = peekedPolicies.concat([]);
        }
        
        for (var i = 0; i < peekedPolicies.length; i++) {
            msg += `${peekedPolicies[i]}\n`;
        }
        
        return msg;
    }
    
    getUsers(players) {
        let users = [];
        let usersNotFound = 0;
        
        for(var i = 0; i < players.length; i++) {
            const player = players[i];
            let user = null;
            
            if (player.includes('@')) {
                user = this.getUserFromId(player);
            } else {
                user = this.getUserFromName(player);
            }
            
            if (!user) {
                usersNotFound++;
                continue;
            }
            
            users.push(user);
        }
        
        if (usersNotFound > 0) {
            this.sendMessageLine(`There were ${usersNotFound} that could not be found.`);
        }
        
        return users;
    }
    
    getUserFromName(playerName) {
        return this.guild.members.find(m => {
            const name = m.nickname ? m.nickname : m.user.username;
            const isOnline = m.user.presence.status == 'online';
            return !m.user.bot && isOnline && name.toLowerCase().includes(playerName.toLowerCase());
        });
    }
    
    getUserFromId(playerIds) {
        const playerId = extractUserId(player);
        const user = this.guild.members.get(playerId);
        
        return !user.user.bot ? user : null;
    }
    
    getAllUsersInAuthorsChannel(author) {
        var voiceChannelId = author.lastMessage.member.voiceChannelID;
        
        if(!voiceChannelId) {
            this.sendMessageLine(`User ${author.username} is not in a voice channel - join a voice channel and start again.`);
            return null;
        }
        
        var voiceChannel = this.guild.channels.get(voiceChannelId);
        
        return voiceChannel.members.map(u => u).filter(u => !u.user.bot);
    }
    
    getVisualGameboardDisplay() {
        const facistBoardVisual = this.gameBoard.getFacistBoardVisual();
        const liberalBoardVisual = this.gameBoard.getLiberalBoardVisual();
        
        const facistBoardEmbed = new Discord.RichEmbed()
            .setColor(12411490)
            .setImage(facistBoardVisual);
            
        const liberalBoardEmbed = new Discord.RichEmbed()
            .setColor(6921935)
            .setTimestamp()
            .setImage(liberalBoardVisual);
        
        return [facistBoardEmbed, liberalBoardEmbed];
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
        this.log('Creating gameboard...');
        this.gameBoard = new Gameboard(this.players.length);
    }
    
    createMemberships() {
        this.log('Creating membership decks...');
        let numOfFacists = 2;
        if (this.players.length > 6 && this.players.length < 9) {
            numOfFacists = 3;
        } else if (this.players.length >= 9) {
            numOfFacists = 4;
        }
        
        this.addFacistMemberships(numOfFacists);
        this.addLiberalMemberships(this.players.length - numOfFacists);
        this.membershipDeck = shuffle(this.membershipDeck);
        
        this.log('Shuffling party/role cards...');
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
        this.log('Creating policy deck...');
        for (var i = 0; i < FacistPolicies; i++) {
            this.deck.push(Game.Policies.Facist);
        }

        for (var i = 0; i < LiberalPolicies; i++) {
            this.deck.push(Game.Policies.Liberal);
        }

        this.shuffleDeck();
        
        this.log('Shuffling policy deck...');
        this.log(this.deck);
    }

    shuffleDeck() {
        this.deck = shuffle(this.deck);
    }
    
    shufflePlayerOrder() {
        this.players = shuffle(this.players);
    }
    
    shuffleAndAddDiscardPile() {
        this.log('Shuffling discard pile back into deck...');
        this.discardPile = shuffle(this.discardPile);
        this.deck = this.deck.concat(this.discardPile);
        this.discardPile = [];
    }
    
    assignMemberships() {
        this.log('Assigning memberships...');
        
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].assignMembership(this.membershipDeck.pop());
        }
        
        for(var i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            
            if (player.isFacist && !player.isHitler) {
                this.facists.push(player);
            } else if (player.isLiberal) {
                this.liberals.push(player);
            } else if (player.isHitler) {
                this.hitler = player;
            }
        }
        
        for(var i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const embeddedMsg = createEmbeddedMessage(player.getFullMembershipInfo(this.hitler, this.facists, this.doesHitlerKnowFacists));
            player.user.send(embeddedMsg);
        }        
        
        this.sendMessageLine('Dealing party/role cards...\nPlease check your DM for your party and role assignement!\n');
    }
    
    assignRandomPresident() {        
        this.log('Assigning random president...');
        if (!this.checkState(Game.GameStates.AssignPresident)) return;
        
        this.presidentIndex = getRandomInt(this.players.length);        
        this.president = this.players[this.presidentIndex];
        this.channcelorIndex = null;
        this.chancellor =  null;
        
        this.sendMessageLine(`${this.president.nickname} will start as the President`);
        this.setState(Game.GameStates.NominateChancellor);
    }
    
    assignNextPresident(player) {
        this.log('Assigning president...');
        if (!this.checkState(Game.GameStates.AssignPresident)) return;
        let notice = '';
        
        if (this.previousPresidentIndex !== null && this.speciallyElectedPresident) {
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
        this.log('Nominating chancellor...');
        
        if (!this.checkState(Game.GameStates.NominateChancellor)) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayerByArg(nominated);
            
			if (!player) return;
            
			if (player.id === author.id) {
				this.sendMessageLine(`President ${player.nickname} cannot nominate themself`);
                return;
			}
			
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
		let result = null;
		
        if (this.nominatedChancellor && player && !this.votes[player.id]) {
            this.log('vote: '+ vote);
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
                this.log(this.votes);
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
		
		return result;
    }
    
    electChancellor() {
		this.votes = { count: 0 };
        this.chancellor = this.nominatedChancellor;
        this.nominatedChancellor = null;
        this.sendMessageLine(`${this.chancellor.nickname} has been elected chancellor.`);
        this.setState(Game.GameStates.PresidentDrawPolicies);
        
        if (this.doFacistsWin(true)) {
            this.gameRunning = false;
            this.setState(Game.GameStates.Finished);
        }
    }
    
    rejectNomination() {
		this.votes = { count: 0 };
        this.gameBoard.increaseElectionTracker();
        const msg = `${this.nominatedChancellor.nickname} was not elected chancellor.\nRejected Election Tracker: ${this.gameBoard.NumOfRejectedGovts}`
                
        this.sendMessageLine(msg);
        this.nominatedChancellor = null;
        this.chancellor = null;
        
        if (this.gameBoard.NumOfRejectedGovts >= 3) {
            this.enactTopPolicy();
            return;
        }
        
        this.setState(Game.GameStates.AssignPresident);
        this.assignNextPresident();
    }
    
    enactTopPolicy() {
        this.enactPolicy(this.deck.shift());
    }
    
    drawPolicies(author) {
        if (!this.checkState(Game.GameStates.PresidentDrawPolicies)) return;
        
        const player = this.findPlayer(author.id);
        
        if (player.id === this.president.id) {
            if (this.deck.length < 3) {
                this.shuffleAndAddDiscardPile();
            }
        
            this.drawnPolicies = this.deck.splice(0, 3);            
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
                this.log('More than one policy left after Chancellor discarded');
                this.log(this.drawnPolicies);
            } else if (this.drawnPolicies.length === 0) {
                this.log('No policies left after chancellor discarded!');
            }
            
            this.enactPolicy(this.drawnPolicies[0]);
        }        
    }
    
    handOverToChancellor() {        
        this.chancellor.user.send(this.getDrawnPolicyInfo());
        this.setState(Game.GameStates.ChancellorDiscardPolicy);
    }
    
    vetoPolicies(author) {
        if (!this.checkState(Game.GameStates.ChancellorDiscardPolicy)) return;
        if (this.chancellorRequestedVeto) return;
        
        const player = this.findPlayer(author.id);
        if (player.id === this.chancellor.id) {
            this.chancellorRequestedVeto = true;
            this.sendMessageLine(`Chancellor ${this.chancellor.nickname} has requested a veto of the current policies. President ${this.president.nickname} can either consent or reject using !consent <ja|nein>`);        
            this.setState(Game.GameStates.ChancellorVetoRequested);
        }
    }
    
    consentVetoRequest(author, consent) {
        if (!this.checkState(Game.GameStates.ChancellorVetoRequested)) return;
        
        consent = consent.toLowerCase();
        const player = this.findPlayer(author.id);
        if (player.id === this.president.id) {
            if (consent === 'nein' || consent === 'n' || consent === 'no') {
                this.setState(Game.GameStates.ChancellorDiscardPolicy);
            } else if (consent === 'ja' || consent === 'j' || consent === 'y' || consent === 'yes') {
                this.discardPile = this.discardPile.concat(this.drawnPolicies);
                this.drawnPolicies = [];
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
        
        this.sendGameboardVisualDisplay();
        
        this.log('checking win conditions...');
        if (this.doFacistsWin() || this.doLiberalsWin()) {
            this.gameRunning = false;
            this.setState(Game.GameStates.Finished);
            return;
        }
        
        this.log('checking exec actions...');
        const executiveAction = this.gameBoard.getUnlockedExecutiveAction();
        if (executiveAction != Gameboard.PresidentialPowers.None) {
            this.handleExecutiveAction(executiveAction);
        } else {
            this.setState(Game.GameStates.AssignPresident);
            this.assignNextPresident();
        }
    }
    
    handleExecutiveAction(executiveAction) {
        this.log(`handling exec action: ${executiveAction}`);
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
            this.log(`Unknown presidential power: ${executiveAction}`);
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
            const player = this.findPlayerByArg(user);
            const hasBeenInvestigated = this.investigatedPlayers.find(pid => pid === player.id);
            
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
            const player = this.findPlayerByArg(newPres);
            
            if (player.isDead) {
                this.sendMessageLine(`${player.nickname} is dead and cannot be chosen as President`);
                return;
            } else if (player.id === this.president.id) {
                this.sendMessageLine(`President ${player.nickname} cannot elect themself`);
                return;
            }
            
            this.setState(Game.GameStates.AssignPresident);
            this.assignNextPresident(player);
        }
    }
    
    startExecution() {
        this.sendMessageLine(`The Execution Executive Action has been unlocked.\nPresident ${this.president.nickname} can choose a single player to execute using !shoot <player>...`);        
        this.setState(Game.GameStates.PresidentShootPlayer);
    }
    
    shootPlayer(author, user) {
        if (!this.checkState(Game.GameStates.PresidentShootPlayer)) return;
        
        if (author.id === this.president.id) {
            const player = this.findPlayerByArg(user);
            
            if (player.isDead) {
                this.sendMessageLine(`${player.nickname} has already been executed and cannot be made more dead`);
                return;
            } else if (player.id === this.president.id) {
                this.sendMessageLine(`Sorry, you can't shoot yourself ${player.nickname}`);
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
    
    doFacistsWin(justElected = false) {        
        if (this.gameBoard.NumOfFacistPolicies === 6) {
            const msg = `6 Facist policies enacted!\n{this.hitler.nickname} and his facists win!`;
            this.sendMessageLine(msg);
            this.facistsWon = true;
            return true;
        }

        if (justElected) {
            if (this.gameBoard.NumOfFacistPolicies >= 3 && this.chancellor && this.chancellor.isHitler) {
                const msg = `{this.channcelor.nickname} is Hitler!\n{this.hitler.nickname} and his facists win!`;
                this.sendMessageLine(msg);
                this.facistsWon = true;
                return true;
            }
        }
        
        return false;
    }
    
    doLiberalsWin() {
        if (this.gameBoard.NumOfLiberalPolicies === 5) {
            const msg = `5 Liberal policies enacted!\nThe Liberals win!`;
            this.sendMessageLine(msg);
            this.liberalsWon = true;
            return true;
        }
        
        if (this.hitler && this.hitler.isDead) {
            const msg = `Hitler (${this.hitler.nickname}) has been killed!\n The Liberals win!`;
            this.liberalsWon = true;
            return true;
        }
        
        return false;
    }
    
    findUsersPlaying(author, players) {
        this.log('Finding players...');
        
        let foundPlayers = [];
        
        if (!players) {
            foundPlayers = this.getAllUsersInAuthorsChannel(author);
        } else {
            const playersArray = players.split(" ");
            foundPlayers = this.getUsers(playersArray);
        }
        
        if (!foundPlayers) {
            return null;
        }
        
        if (foundPlayers.length < MinPlayers) {
            this.sendMessageLine(`Not enough players found. A minimum of 5 players are required and only ${foundPlayers.length} were found.`);
            return null;
        }
        
        let notice = '';        
        if (foundPlayers.length > 10) {
            notice += 'Found more than 10 possible players, using the first 10 found.\n';
            foundPlayers = foundPlayers.slice(0, 10);
        }
        
        for(var i = 0; i < foundPlayers.length; i++) {
            this.players.push(new Player(foundPlayers[i].user));
        }
        
        this.doesHitlerKnowFacists = this.players.length <= 6;
        
        notice += 'The following users are now playing:\n';
        
        for(var i = 0; i < this.players.length; i++) {
            notice += `${this.players[i].nickname}\n`;
        }
        
        this.sendMessageLine(notice);
        return true;
    }
    
    startGame(players, message) {
        if (!this.guild) {
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
        
        this.resetGameDecks();
        
        if (!this.findUsersPlaying(message.author, players)) {
            this.gameRunning = false;
            this.setState(Game.GameStates.Finished);
            return;
        }
        
        this.createGameboard();
        this.createMemberships();
        this.createDeck();
        this.shufflePlayerOrder();        
        this.assignMemberships();
    
        this.setState(Game.GameStates.AssignPresident);
        this.assignRandomPresident();
    }
    
    resetGameDecks() {
        this.players = [];
        this.membershipDeck = [];
        this.deck = [];
    }
    
    showGameStateInfo() {
        let info = 'Current Game State:\n';
        info += '---------------------\n\n';
        info += this.gameBoard.getGameboardDisplay();
        info += `Policy cards left: ${this.deck.length}\n\n`;
        
        info += `President: ${this.president ? this.president.nickname : 'None'}\n`;
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
    
    endGame(author, confirm) {
        if (!this.gameRunning || this.checkState(Game.GameStates.Finished)) return;
        
        if (!this.checkState(Game.GameStates.ConfirmEndGame)) {
            this.preEndConfirmState = this.gameState;
            this.setState(Game.GameStates.ConfirmEndGame);
            this.sendMessageLine('Are you sure you want to end the current game? Confirm using !end y or !end n');
            return;
        } else {
            if (!confirm) return;
            
            confirm = confirm.toLowerCase();
            if (confirm === 'nein' || confirm === 'n' || confirm === 'no') {
                this.setState(this.preEndConfirmState);
                this.sendMessageLine('Continuing game...');
            } else if (confirm === 'ja' || confirm === 'j' || confirm === 'y' || confirm === 'yes') {
                this.sendMessageLine('Ending game... Thanks for playing!');
                this.gameRunning = false;
                this.setState(Game.GameStates.Finished);
            } else {
                return;
            }
            
            this.preEndConfirmState = null;
        }
    }
    
    static get Commands() {
        return [
            {
                name: 'play',
                alias: ['start', 'pl'],
                description: 'Starts a new game',
                usage: 'play <optional list of players>',
                example: 'play or !play @Player#1111, player123, ...',
                action: 'startGame'
            },
            {
                name: 'nominate',
                description: 'Nominate a player as chancellor',
                usage: 'nominate <player>',
                example: 'nominate @Player#1111 | nominate player123',
                action: 'nominateChancellor'            
            },
            {
                name: 'vote',
                description: 'Votes on the current election',
                usage: 'vote <ja|nein|yes|no|j|n|y>',
                action: 'voteOnNomination'            
            },
            {
                name: 'draw',
                description: 'Draws three policy cards',
                usage: 'draw',
                action: 'drawPolicies'            
            },
            {
                name: 'discard',
                description: 'Discards the specified card',
                usage: 'discard <card # to discard>',
                usage: 'discard 1',
                action: 'discardPolicy'            
            },
            {
                name: 'elect',
                description: 'Elects a specially elected president (when applicable)',
                usage: 'elect <player>',
                example: 'elect @Player#1111 | elect player123',
                action: 'speciallyElectPresident'
            },
            {
                name: 'shoot',
                description: 'Shoots the specified player (when applicable)',
                usage: 'shoot <player>',
                example: 'shoot @Player#1111 | shoot player123',
                action: 'shootPlayer'            
            },
            {
                name: 'veto',
                description: 'Initates a veto of the current policies (when applicable)',
                usage: 'veto',
                action: 'vetoPolicies'            
            },
            {
                name: 'consent',
                description: 'Consents or denies to a requested veto (when applicable)',
                usage: 'consent <ja|nein|yes|no|j|n|y>',
                action: 'consentVetoRequest'            
            },
            {
                name: 'info',
                description: 'Displays the status of enacted policies, number of policy cards left, current Election Tracker status, current government, and any dead players',
                usage: 'info',
                action: 'showGameStateInfo'            
            },
            {
                name: 'end',
                description: 'Ends the current game (requires confirmation)',
                usage: 'end',
                action: 'endGame'
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
            ConfirmEndGame: 15,
            Finished: 16
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