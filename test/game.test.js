'use strict'

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockUser from './mockuser.js';
import Game from '../src/game.js';
import Gameboard from '../src/gameboard.js';
const { cmd_channel } = require('../src/config.json');

const should = chai.should();
const expect = chai.expect();

const getRandomInt = function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
};
    
const createDiscordUserId = function createDiscordUserId(id) {
    return `<@!${id}>`;
};

chai.use(sinonChai);

describe('Tests for the game logic', () => {
    let numOfPlayers = 5;
    let message = {};
    let client = {};
    let client_6 = {};
    let channels = [];
    let voiceChannel = {};
    let cmdChannel = {};
    let mockUsers = [];
    let mockUsers_6 = [];
    const voiceChannelId = 'mock_voice_channel';
    
    const getNonPresidentPlayer = function getNonPresidentPlayer(game) {
        let nominatedIndex = getRandomInt(game.players.length);
        
        while (nominatedIndex === game.presidentIndex) {
            nominatedIndex = getRandomInt(game.players.length);
        }
        
        return game.players[nominatedIndex];
    };
    
    const setNumOfPlayers = function setNumOfPlayers(num) {
        mockUsers = [];
        numOfPlayers = num;
        
        for(var i = 0; i < numOfPlayers; i++) {
            mockUsers.push(new MockUser());
        }
        
        message = {
            author: {
                lastMessage: {
                    member: {
                        voiceChannelID: voiceChannelId
                    }
                }
            },
            channel: {
                send: function () { } 
            }
        };
        
        voiceChannel = {
            id: voiceChannelId,
            members: mockUsers
        };
        
        cmdChannel = {
            id: cmd_channel,
            send: function (msg) { }
        };
        
        channels = [voiceChannel, cmdChannel];
        
        client = {
            isMock: true,
            test_peekedPolicies: [],
            channels: {
                get: function (id) { return channels.find(c => c.id === id); }
            },
            users: {
                get: function (id) { return mockUsers.find(u => u.id === id); }
            }
        };
    };
    
    before(() => {      
        setNumOfPlayers(numOfPlayers);
    });
    
    it('Should setup the game', () => {
        const game = new Game(client);
        
        sinon.spy(game, 'setState');
        
        game.startGame(null, message);
        
        game.gameChannel.should.exist;
        game.gameRunning.should.be.true;
        
        game.gameBoard.should.exist;
        game.deck.should.exist;
        game.deck.length.should.equal(18);
        game.membershipDeck.should.exist;
        
        game.players.length.should.equal(mockUsers.length);
        
        game.liberals.length.should.equal(mockUsers.length - 2);
        game.facists.length.should.equal(1);
        game.hitler.should.exist;
        
        game.president.should.exist;
        game.presidentIndex.should.exist;
        game.presidentIndex.should.not.equal(-1);
        should.not.exist(game.chancellor);
        
        game.drawnPolicies.length.should.equal(0);
        
        for(var i = 0; i < game.players.length; i++) {
            game.players[i].membership.should.exist;
        }
        
        game.gameState.should.equal(Game.GameStates.NominateChancellor);
        
        game.setState.callCount.should.equal(3);
    });
    
    it('Should not start a game if one is already started', () => {
        const game = new Game(client);
        game.startGame(null, message);
        
        sinon.spy(game, 'setState');
        sinon.spy(game, 'findUsersPlaying');
        
        game.startGame(null, message);
        
        game.gameRunning.should.be.true;
        game.setState.should.not.have.been.called;
        game.findUsersPlaying.should.not.have.been.called;
    });
    
    it('Should not start the game if there is not client reference', () => {
        const game = new Game();        
        sinon.spy(game, 'setState');
        sinon.spy(game, 'findUsersPlaying');
        
        game.startGame(null, message);
        
        game.gameRunning.should.be.false;
        game.setState.should.not.have.been.called;
        game.findUsersPlaying.should.not.have.been.called;
    });
    
    describe('Chancellor nomination tests', () => {
        it('Should nominate a chancellor', () => {
            const game = new Game(client);
            
            game.startGame(null, message);      
            
            const nonPresidentPlayer = getNonPresidentPlayer(game);     
            const nominatedDiscordUserId = createDiscordUserId(nonPresidentPlayer.id);
            
            sinon.spy(game, 'setState');
            game.nominateChancellor(game.president, nominatedDiscordUserId);
            
            game.gameState.should.equal(Game.GameStates.VoteOnNomination);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should not nominate a chancellor if not on the NominateChancellor state', () => {
            const game = new Game(client);
            
            game.startGame(null, message);
            
            game.setState(Game.GameStates.AssignPresident);
            
            const nonPresidentPlayer = getNonPresidentPlayer(game);     
            const nominatedDiscordUserId = createDiscordUserId(nonPresidentPlayer.id);
            
            sinon.spy(game, 'setState');
            game.nominateChancellor(game.president, nominatedDiscordUserId);
            
            game.setState.should.have.not.been.called;
        });
        
        it('Should not nominate a dead player', () => {
            const game = new Game(client);
            
            game.startGame(null, message);
            
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            nonPresidentPlayer.isDead.should.be.false;      
            nonPresidentPlayer.isDead = true;
            
            const nominatedDiscordUserId = createDiscordUserId(nonPresidentPlayer.id);
            
            sinon.spy(game, 'setState');
            game.nominateChancellor(game.president, nominatedDiscordUserId);
                    
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.not.been.called;
        });
        
        it('Should not nominate a player in previous govt', () => {
            const game = new Game(client);
            
            game.startGame(null, message);
            
            const nonPresidentPlayer = getNonPresidentPlayer(game);     
            const nominatedDiscordUserId = createDiscordUserId(nonPresidentPlayer.id);
            game.previousGovernment.push(nonPresidentPlayer.id);
            
            sinon.spy(game, 'setState');
            game.nominateChancellor(game.president, nominatedDiscordUserId);
                    
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.not.been.called;
        });
        
        it('Should not accepts nominations from a non-president player', () => {
            const game = new Game(client);
            
            game.startGame(null, message);
            
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            let nominatedPlayer = getNonPresidentPlayer(game);
            
            while(nominatedPlayer.id === nonPresidentPlayer.id) {
                nominatedPlayer = getNonPresidentPlayer(game);
            }
            
            const nominatedDiscordUserId = createDiscordUserId(nominatedPlayer.id);
            
            sinon.spy(game, 'setState');
            game.nominateChancellor(nonPresidentPlayer, nominatedPlayer);
                    
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.not.been.called;
        });
        
        it('Should not allow a player to nominate themself', () => {
            const game = new Game(client);
            
            game.startGame(null, message);
                    
            const nominatedDiscordUserId = createDiscordUserId(game.president.id);
            
            sinon.spy(game, 'setState');
            game.nominateChancellor(game.president, nominatedDiscordUserId);
                    
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.not.been.called;
        });
    });
    
    describe('Chancellor election tests', () => {
        const setupGameForVoting = function() {
            const game = new Game(client)            
            game.startGame(null, message);
            
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            const initialPresidentId = game.president.id;
            
            game.nominatedChancellor = nonPresidentPlayer;
            game.setState(Game.GameStates.VoteOnNomination);           
            sinon.spy(game, 'setState');
            sinon.spy(game.gameBoard, 'increaseElectionTracker');
            
            return [ game, initialPresidentId, nonPresidentPlayer ];
        };
        
        const resetExistingGameForVoting = function resetExistingGameForVoting(game, resetTracker = true) {
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            const initialPresidentId = game.president.id;
            
            game.nominatedChancellor = nonPresidentPlayer;
            
            if (resetTracker) {
                game.gameBoard.resetElectionTracker();
            }
            
            game.setState(Game.GameStates.VoteOnNomination);
            game.setState.resetHistory();
            game.gameBoard.increaseElectionTracker.resetHistory();
            
            return [initialPresidentId, nonPresidentPlayer];
        };
        
        const checkForPassingElection = function checkForPassingElection(game, nominatedPlayer) {
            game.votes.count.should.equal(0);
            game.chancellor.id.should.equal(nominatedPlayer.id);
            should.not.exist(game.nominatedChancellor);
            game.gameState.should.equal(Game.GameStates.PresidentDrawPolicies);
            game.setState.should.have.been.calledOnce;
        };
        
        const checkForRejectedElection = function checkForRejectedElection(game, initialPresidentId) {
            game.votes.count.should.equal(0);
            should.not.exist(game.chancellor);
            should.not.exist(game.nominatedChancellor);
            game.president.id.should.not.equal(initialPresidentId);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.callCount.should.equal(2);
            game.gameBoard.increaseElectionTracker.should.have.been.calledOnce;
        };
        
        it('Should not allow voting if not in the VoteOnNomination state', () => {
            const game = new Game(client);            
            game.startGame(null, message);           
            sinon.spy(game, 'setState');
            
            game.players.forEach(p => game.voteOnNomination(p, 'ja'));
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.votes.count.should.equal(0);
            game.gameBoard.govtRejectCount.should.equal(0);
            game.gameBoard.facistPolicies.should.equal(0);
            game.gameBoard.liberalPolicies.should.equal(0);
            should.not.exist(game.chancellor);
            game.setState.should.not.have.been.called;
        });
        
        it('Should elect the chancellor if the jas have a majority', () => {
            const [ game, , nominatedPlayer ] = setupGameForVoting();
            
            game.players.forEach(p => game.voteOnNomination(p, 'ja'));
            
            checkForPassingElection(game, nominatedPlayer);
        });
        
        it('Should reject the nomination if the neins have a majority', () => {
            const [ game, initialPresidentId, ] = setupGameForVoting();
            
            game.players.forEach(p => game.voteOnNomination(p, 'nein'));
            
            checkForRejectedElection(game, initialPresidentId);
        });
        
        it ('Should reject the nomination if the votes tie', () => {
            setNumOfPlayers(6);
            
            const [ game, initialPresidentId, ] = setupGameForVoting();
            
            for( var i = 0; i < game.players.length; i++) {
                let vote = 'nein';
                if (i < 3) {
                    vote = 'ja';
                }
                
                game.voteOnNomination(game.players[i], vote);
            }
            
            checkForRejectedElection(game, initialPresidentId);
        });
        
        it('Should accept ja, j, y, yes, nein, n, and no as votes', () => {
            let [ game, initialPresidentId, nominatedPlayer ] = setupGameForVoting();
            game.players.forEach(p => game.voteOnNomination(p, 'ja'));
            checkForPassingElection(game, nominatedPlayer);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game);
            game.players.forEach(p => game.voteOnNomination(p, 'j'));
            checkForPassingElection(game, nominatedPlayer);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game);
            game.players.forEach(p => game.voteOnNomination(p, 'yes'));            
            checkForPassingElection(game, nominatedPlayer);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game);
            game.players.forEach(p => game.voteOnNomination(p, 'y'));            
            checkForPassingElection(game, nominatedPlayer);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game);
            game.players.forEach(p => game.voteOnNomination(p, 'nein'));            
            checkForRejectedElection(game, initialPresidentId);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game);
            game.players.forEach(p => game.voteOnNomination(p, 'no'));            
            checkForRejectedElection(game, initialPresidentId);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game);
            game.players.forEach(p => game.voteOnNomination(p, 'n'));            
            checkForRejectedElection(game, initialPresidentId);
        });
        
        it('Should enact policy on three failed elections', () => {
            let [ game, initialPresidentId, nominatedPlayer ] = setupGameForVoting();
            game.players.forEach(p => game.voteOnNomination(p, 'nein'));            
            checkForRejectedElection(game, initialPresidentId);
            
            game.gameBoard.govtRejectCount.should.equal(1);
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game, false);
            game.players.forEach(p => game.voteOnNomination(p, 'nein'));            
            checkForRejectedElection(game, initialPresidentId);
            
            game.gameBoard.govtRejectCount.should.equal(2);            
            const topPolicy = game.deck[0];
            
            [initialPresidentId, nominatedPlayer] = resetExistingGameForVoting(game, false);
            game.players.forEach(p => game.voteOnNomination(p, 'nein'));            
            checkForRejectedElection(game, initialPresidentId);
            
            game.gameBoard.govtRejectCount.should.equal(0);
            
            if (topPolicy === Game.Policies.Facist) {
                game.gameBoard.facistPolicies.should.equal(1);
            } else if (topPolicy === Game.Policies.Liberal) {
                game.gameBoard.liberalPolicies.should.equal(1);
            } else {
                expect.fail(null, topPolicy, 'Unknown policy type');
            }
        });
    });

    describe('President draw policies tests', () => {
        const setupGameForDrawPolicies = function setupGameForDrawPolicies() {
            const game = new Game(client);            
            game.startGame(null, message);
            
            const chancellor = getNonPresidentPlayer(game);
            game.chancellor = chancellor;
            game.setState(Game.GameStates.PresidentDrawPolicies);
            sinon.spy(game, 'setState');
            
            return [game, game.deck.length];
        };
        
        it ('Should not draw policies if not in the PresidentDrawPolicies state', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            
            const initialGameState = game.gameState;
            const initialDeckLength = game.deck.length;
            sinon.spy(game, 'setState');
            
            game.drawPolicies(game.president);
            
            game.deck.length.should.equal(initialDeckLength);
            game.drawnPolicies.length.should.equal(0);
            game.gameState.should.equal(initialGameState);
            game.setState.should.not.have.been.called;
        });
        
        it('Should draw policies for president', () => {
            const [game, initialDeckLength] = setupGameForDrawPolicies();
            
            const top3Cards = game.deck.slice(0, 3);
            
            game.drawPolicies(game.president);
            
            game.deck.length.should.equal(initialDeckLength - 3);
            game.drawnPolicies.length.should.equal(3);
            
            for(var i = 0; i < game.drawnPolicies.length; i++) {
                game.drawnPolicies[i].should.equal(top3Cards[i]);
            }
            
            game.gameState.should.equal(Game.GameStates.PresidentDiscardPolicy);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should not draw policies for a non-president player', () => {
            const [game, initialDeckLength] = setupGameForDrawPolicies();
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            
            game.drawPolicies(nonPresidentPlayer);
            
            game.deck.length.should.equal(initialDeckLength);
            game.drawnPolicies.length.should.equal(0);
            game.gameState.should.equal(Game.GameStates.PresidentDrawPolicies);
            game.setState.should.not.have.been.called;
        });
        
        it('Should shuffle in the discard deck if there are less than 3 policy cards left', () => {
            const [game, initialDeckLength] = setupGameForDrawPolicies();
            game.discardPile = game.deck.splice(2);
            sinon.spy(game, 'shuffleAndAddDiscardPile');
            
            const top2Cards = game.deck.slice(0, 2);
            
            game.drawPolicies(game.president);
            
            game.deck.length.should.equal(initialDeckLength - 3);
            game.drawnPolicies.length.should.equal(3);
            
            for(var i = 0; i < top2Cards.length; i++) {
                game.drawnPolicies[i].should.equal(top2Cards[i]);
            }
            
            game.gameState.should.equal(Game.GameStates.PresidentDiscardPolicy);
            game.setState.should.have.been.calledOnce;
            game.shuffleAndAddDiscardPile.should.have.been.calledOnce;
        });
    });
    
    describe('President discard tests', () => {
        const setupGameForPolicyDiscardByPresident = function setupGameForPolicyDiscardByPresident() {
            const game = new Game(client);            
            game.startGame(null, message);
            
            const chancellor = getNonPresidentPlayer(game);
            game.chancellor = chancellor;
            game.drawnPolicies = game.deck.splice(0, 3);
            
            game.setState(Game.GameStates.PresidentDiscardPolicy);
            sinon.spy(game, 'setState');
            
            return [game, game.discardPile.length];
        };
        
        const checkIfNotDiscarded = function checkIfNotDiscarded(game, expectedDiscardLength) {
            game.drawnPolicies.length.should.equal(3);
            game.discardPile.length.should.equal(expectedDiscardLength);
            game.gameState.should.equal(Game.GameStates.PresidentDiscardPolicy);
            game.setState.should.not.have.been.called;
        };
        
        it('Should not discard a policy if the state is incorrect', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            
            game.discardPolicy(game.president, 1);
            
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.not.have.been.called;
        });
        
        it('Should not discard a policy if state is PresidentDiscardPolicy and not the president', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByPresident();
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            
            game.discardPolicy(nonPresidentPlayer, 1);
            
            checkIfNotDiscarded(game, initialDiscardPileLength);
        });
        
        it('Should discard a policy and handover remaining to chancellor', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByPresident();
            const expectedDiscard = game.drawnPolicies[0];
            
            game.discardPolicy(game.president, 1);
            
            game.drawnPolicies.length.should.equal(2);
            game.discardPile.length.should.equal(initialDiscardPileLength + 1);
            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should not discard a policy if the discard option is not a number', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByPresident();
            
            game.discardPolicy(game.president, 'a');
            
            checkIfNotDiscarded(game, initialDiscardPileLength);
        });
        
        it('Should not discard a policy if the discard option is not 1-3', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByPresident();
            
            game.discardPolicy(game.president, game.drawnPolicies.length + 1);
            
            checkIfNotDiscarded(game, initialDiscardPileLength);
        });
        
        it('Should place the discarded policy in the discard pile', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByPresident();
            const expectedDiscard = game.drawnPolicies[0];
            
            game.discardPolicy(game.president, 1);            
            const [lastInDiscard] = game.discardPile.slice(-1);
            
            game.drawnPolicies.length.should.equal(2);
            game.discardPile.length.should.equal(initialDiscardPileLength + 1);
            lastInDiscard.should.equal(expectedDiscard);
        });
    });
    
    describe('Chancellor discard tests', () => {
        const setupGameForPolicyDiscardByChancellor = function setupGameForPolicyDiscardByChancellor() {
            const game = new Game(client);            
            game.startGame(null, message);
            
            const chancellor = getNonPresidentPlayer(game);
            game.chancellor = chancellor;
            game.drawnPolicies = game.deck.splice(0, 3);
            game.discardPile = game.drawnPolicies.splice(0, 1);
            
            game.setState(Game.GameStates.ChancellorDiscardPolicy);
            sinon.spy(game, 'setState');
            
            return [game, game.discardPile.length];
        };
        
        const checkIfNotDiscarded = function checkIfNotDiscarded(game, expectedDiscardLength) {
            game.drawnPolicies.length.should.equal(2);
            game.discardPile.length.should.equal(expectedDiscardLength);
            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            game.setState.should.not.have.been.called;
        };
        
        it('Should not discard a policy if the state is incorrect', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            sinon.spy(game, 'setState');
            
            game.discardPolicy(game.chancellor, 1);
            
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.not.have.been.called;
        });
        
        it('Should not discard a policy if state is ChancellorDiscardPolicy and not the chancellor', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByChancellor();
            
            game.discardPolicy(game.president, 1);
            
            checkIfNotDiscarded(game, initialDiscardPileLength);
        });
        
        it('Should discard a policy and enact remaining policy', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByChancellor();
            const expectedDiscard = game.drawnPolicies[0];
            const expectedEnactedPolicy = game.drawnPolicies[1];
            sinon.spy(game.gameBoard, 'resetElectionTracker');
            
            game.discardPolicy(game.chancellor, 1);
            
            game.drawnPolicies.length.should.equal(1);
            game.discardPile.length.should.equal(initialDiscardPileLength + 1);
            
            if (expectedEnactedPolicy === Game.Policies.Facist) {
                game.gameBoard.facistPolicies.should.equal(1);
            } else if (expectedEnactedPolicy === Game.Policies.Liberal) {
                game.gameBoard.liberalPolicies.should.equal(1);
            }
            
            game.gameBoard.govtRejectCount.should.equal(0);
            game.gameBoard.resetElectionTracker.should.have.been.calledOnce;
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.been.calledTwice;
        });
        
        it('Should not discard a policy if the discard option is not a number', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByChancellor();
            
            game.discardPolicy(game.chancellor, 'a');
            
            checkIfNotDiscarded(game, initialDiscardPileLength);
        });
        
        it('Should not discard a policy if the discard option is not 1-3', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByChancellor();
            
            game.discardPolicy(game.chancellor, game.drawnPolicies.length + 1);
            
            checkIfNotDiscarded(game, initialDiscardPileLength);
        });
        
        it('Should place the discarded policy in the discard pile', () => {
            const [game, initialDiscardPileLength] = setupGameForPolicyDiscardByChancellor();
            const expectedDiscard = game.drawnPolicies[0];
            
            game.discardPolicy(game.chancellor, 1);            
            const [lastInDiscard] = game.discardPile.slice(-1);
            
            game.drawnPolicies.length.should.equal(1);
            game.discardPile.length.should.equal(initialDiscardPileLength + 1);
            lastInDiscard.should.equal(expectedDiscard);
        });
    });
    
    describe('Chancellor veto request tests', () => {
        const setupGameForVetoConsent = function setupGameForVetoConsent() {
            const game = new Game(client);            
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            game.setState(Game.GameStates.PresidentDrawPolicies);
            
            game.drawPolicies(game.president);
            game.gameState.should.equal(Game.GameStates.PresidentDiscardPolicy);            
            
            game.discardPolicy(game.president, 1);
            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            
            game.vetoPolicies(game.chancellor);
            game.gameState.should.equal(Game.GameStates.ChancellorVetoRequested);
            
            sinon.spy(game, 'setState');
            sinon.spy(game.gameBoard, 'increaseElectionTracker');
            
            return [game, game.discardPile.length, game.drawnPolicies.concat([])];
        };
        
        const checkForAcceptConsent = function checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies) {
            const [secondToLast, lastInDiscard] = game.discardPile.slice(-2);
            vetoedPolicies.length.should.equal(2);
            game.gameBoard.increaseElectionTracker.should.have.been.calledOnce;
            game.chancellorRequestedVeto.should.be.false;
            game.setState.should.have.been.calledTwice;
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.discardPile.length.should.equal(initialDiscardLength + 2);
            vetoedPolicies[0].should.equal(secondToLast);
            vetoedPolicies[1].should.equal(lastInDiscard);
            game.drawnPolicies.should.be.empty;
        };
        
        const checkForRejectConsent = function checkForRejectConsent(game, initialDiscardLength, vetoedPolicies) {
            game.drawnPolicies.should.not.be.empty;
            game.setState.should.have.been.calledOnce;
            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            game.chancellorRequestedVeto.should.be.true;
            game.gameBoard.increaseElectionTracker.should.not.have.been.called;
            game.discardPile.length.should.equal(initialDiscardLength);
            vetoedPolicies.length.should.equal(2);
            game.drawnPolicies.length.should.equal(2);
            game.drawnPolicies.should.include(vetoedPolicies[0]);
            game.drawnPolicies.should.include(vetoedPolicies[1]);
        };
        
        it('Should allow a veto request if the state is ChancellorDiscardPolicy', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            sinon.spy(game, 'setState');
            
            game.vetoPolicies(game.chancellor);
            
            game.chancellorRequestedVeto.should.be.false;
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.not.have.been.called;            
            game.setState(Game.GameStates.ChancellorDiscardPolicy);
            game.setState.resetHistory();
            
            game.vetoPolicies(game.chancellor);

            game.chancellorRequestedVeto.should.be.true;
            game.gameState.should.equal(Game.GameStates.ChancellorVetoRequested);
            game.setState.should.have.been.calledOnce;
        });

        it('Should ignore veto request from non-chancellors', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            game.setState(Game.GameStates.ChancellorDiscardPolicy);
            sinon.spy(game, 'setState');
            
            game.vetoPolicies(game.president);
            
            game.chancellorRequestedVeto.should.be.false;
            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            game.setState.should.not.have.been.called;
        });
        
        it('Should ignore veto requests if on was already requested', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            game.setState(Game.GameStates.ChancellorDiscardPolicy);
            game.chancellorRequestedVeto = true;
            sinon.spy(game, 'setState');
            
            game.vetoPolicies(game.chancellor);
            
            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            game.setState.should.not.have.been.called;
        });
        
        it('Should only allow a veto consent if the state is ChancellorVetoRequested', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            game.chancellorRequestedVeto = true;
            sinon.spy(game, 'setState');
            
            game.consentVetoRequest(game.president, 'n');
            
            game.chancellorRequestedVeto.should.be.true;
            game.setState.should.not.have.been.called;
            
            game.setState(Game.GameStates.ChancellorVetoRequested);
            game.setState.resetHistory();
            
            game.consentVetoRequest(game.president, 'n');

            game.gameState.should.equal(Game.GameStates.ChancellorDiscardPolicy);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should only allow veto consents from the president', () => {
            const [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.chancellorRequestedVeto.should.be.true;
            
            game.consentVetoRequest(getNonPresidentPlayer(game), 'y');
            
            game.chancellorRequestedVeto.should.be.true;
            game.setState.should.not.have.been.called;
            game.gameState.should.equal(Game.GameStates.ChancellorVetoRequested);
        });
        
        it('Should accept ja, j, y, yes, nein, n, and no as consent options', () => {
            let [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'ja');
            checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'JA');
            checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'j');
            checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'yes');
            checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'Y');
            checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'y');
            checkForAcceptConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'nein');
            checkForRejectConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'NeIN');
            checkForRejectConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'no');
            checkForRejectConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'N');
            checkForRejectConsent(game, initialDiscardLength, vetoedPolicies);
            
            [game, initialDiscardLength, vetoedPolicies] = setupGameForVetoConsent();
            game.consentVetoRequest(game.president, 'n');
            checkForRejectConsent(game, initialDiscardLength, vetoedPolicies);
        });
    });
    
    describe('President assignment tests', () => {
        it('Should only assign a random president if the state is AssignPresident', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.setState(Game.GameStates.NominateChancellor);
            game.president = null;
            
            sinon.spy(game, 'setState');
            
            game.assignRandomPresident();
            
            should.not.exist(game.president);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.not.been.called;
        });
        
        it('Should assign a random president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.gameState = Game.GameStates.AssignPresident;
            sinon.spy(game, 'setState');
            
            game.assignRandomPresident();
            
            game.president.should.exist;
            game.president.id.should.equal(game.players[game.presidentIndex].id);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should only assign the next president if the state is AssignPresident', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.setState(Game.GameStates.NominateChancellor);
            const initialPresidentId = game.president.id;
            
            sinon.spy(game, 'setState');
            
            game.assignNextPresident();
            
            game.president.id.should.equal(initialPresidentId);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.not.been.called;
        });
        
        it('Should assign the next player as president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.gameState = Game.GameStates.AssignPresident;
            const initialPresidentId = game.president.id;
            const expectedNewIndex = (game.presidentIndex + 1) % game.players.length;
            sinon.spy(game, 'setState');
            
            game.assignNextPresident();
            
            game.president.id.should.not.equal(initialPresidentId); 
            game.presidentIndex.should.equal(expectedNewIndex);
            game.president.id.should.equal(game.players[expectedNewIndex].id);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should assign the next alive player as president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.gameState = Game.GameStates.AssignPresident;
            sinon.spy(game, 'setState');
            
            const initialPresidentId = game.president.id;
            const nextPlayerIndex = (game.presidentIndex + 1) % game.players.length;
            const expectedNewIndex = (nextPlayerIndex + 1) % game.players.length;
            game.players[nextPlayerIndex].isDead = true;
            
            game.assignNextPresident();
            
            game.president.id.should.not.equal(initialPresidentId); 
            game.presidentIndex.should.equal(expectedNewIndex);
            game.president.id.should.equal(game.players[expectedNewIndex].id);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should reset the current govt', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.gameState = Game.GameStates.AssignPresident;
            game.chancellorRequestedVeto = true;
            game.chancellor = getNonPresidentPlayer(game);
            
            game.assignNextPresident();
            
            should.not.exist(game.chancellor);
            game.chancellorRequestedVeto.should.be.false;
        });
        
        it('Should store the previous govt', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.chancellor = getNonPresidentPlayer(game);
            game.gameState = Game.GameStates.AssignPresident;
            const initialPresidentId =  game.president.id;
            const chancellorId = game.chancellor.id;
            
            game.assignNextPresident();
            
            game.previousGovernment.should.not.be.empty;
            game.previousGovernment.length.should.equal(2);
            game.previousGovernment.should.include(initialPresidentId);
            game.previousGovernment.should.include(chancellorId);
        });
        
        it('Should assign a specially elected player to president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.gameState = Game.GameStates.AssignPresident;
            sinon.spy(game, 'setState');
            
            const initialPresidentIndex = game.presidentIndex;
            const newPres = getNonPresidentPlayer(game);
            
            game.assignNextPresident(newPres);
            
            game.president.should.exist;
            game.president.id.should.equal(newPres.id);
            game.speciallyElectedPresident.should.be.true;
            game.previousPresidentIndex.should.equal(initialPresidentIndex);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should revert to the old order after a special election', () => {
            const game = new Game(client);
            game.startGame(null, message);
            game.gameState = Game.GameStates.AssignPresident;
            
            const initialPresidentIndex = game.presidentIndex;
            const newPres = getNonPresidentPlayer(game);
            
            game.assignNextPresident(newPres);
            
            game.previousPresidentIndex.should.exist;
            game.speciallyElectedPresident.should.be.true;
            
            const expectedNewIndex = (initialPresidentIndex + 1) % game.players.length; 
            const expectedNewPres = game.players[expectedNewIndex];
            game.gameState = Game.GameStates.AssignPresident;
            sinon.spy(game, 'setState');
            
            game.assignNextPresident();
            
            game.president.should.exist;
            game.president.id.should.equal(expectedNewPres.id);
            game.presidentIndex.should.equal(expectedNewIndex);
            game.speciallyElectedPresident.should.be.false;
            should.not.exist(game.previousPresidentIndex);
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
            game.setState.should.have.been.calledOnce;
        });
    });
    
    describe('Handle executive actions tests', () => {
        it('Should execute the correct action for the provided presidential power', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            sinon.spy(game, 'executePolicyPeek');
            sinon.spy(game, 'startLoyaltyInvestigation');
            sinon.spy(game, 'startSpecialElection');
            sinon.spy(game, 'startExecution');
            
            game.handleExecutiveAction(Gameboard.PresidentialPowers.PolicyPeek);
            
            game.executePolicyPeek.should.have.been.calledOnce;
            game.startLoyaltyInvestigation.should.not.have.been.called;
            game.startSpecialElection.should.not.have.been.called;
            game.startExecution.should.not.have.been.called;
            game.setState.should.have.been.calledThrice;
            game.setState.should.been.calledWith(Game.GameStates.PresidentPolicyPeek);
            
            game.setState.resetHistory();
            game.executePolicyPeek.resetHistory();
            
            game.handleExecutiveAction(Gameboard.PresidentialPowers.InvestigateLoyalty);
            
            game.executePolicyPeek.should.not.have.been.called;
            game.startLoyaltyInvestigation.should.have.been.calledOnce;
            game.startSpecialElection.should.not.have.been.called;
            game.startExecution.should.not.have.been.called;
            game.setState.should.have.been.calledTwice;
            game.setState.should.been.calledWith(Game.GameStates.PresidentInvestigateLoyalty);
            
            game.setState.resetHistory();
            game.startLoyaltyInvestigation.resetHistory();
            
            game.handleExecutiveAction(Gameboard.PresidentialPowers.SpecialElection);
            
            game.executePolicyPeek.should.not.have.been.called;
            game.startLoyaltyInvestigation.should.not.have.been.called;
            game.startSpecialElection.should.have.been.calledOnce;
            game.startExecution.should.not.have.been.called;
            game.setState.should.have.been.calledTwice;
            game.setState.should.been.calledWith(Game.GameStates.PresidentSpecialElection);
            
            game.setState.resetHistory();
            game.startSpecialElection.resetHistory();
            
            game.handleExecutiveAction(Gameboard.PresidentialPowers.Execution);
            
            game.executePolicyPeek.should.not.have.been.called;
            game.startLoyaltyInvestigation.should.not.have.been.called;
            game.startSpecialElection.should.not.have.been.called;
            game.startExecution.should.have.been.calledOnce;
            game.setState.should.have.been.calledTwice;
            game.setState.should.been.calledWith(Game.GameStates.PresidentExecution);
        });
    });
    
    describe('Policy peek executive action tests', () => {
        it('Should only execute a policy peek when instructed', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            const initialGameState = game.gameState;
            
            sinon.spy(game, 'setState');
            
            game.executePolicyPeek();
                        
            game.gameState.should.equal(initialGameState);
            game.setState.should.have.been.calledTwice;
        });
        
        it('Should show the next 3 policies', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            const expectedPeek = game.deck.slice(0, 3);
            
            game.executePolicyPeek();
            
            game.client.test_peekedPolicies.length.should.equal(3);
            
            for(var i = 0; i < expectedPeek.length; i++) {
                game.client.test_peekedPolicies[i].should.equal(expectedPeek[i]);
            }
        });
    });
    
    describe('Investigate loyalty tests', () => {
        it('Investigate player should only be allowed if the state is PresidentInvestigatePlayer', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            const initialGameState = game.gameState;
            
            game.investigatePlayer(game.president, createDiscordUserId(getNonPresidentPlayer(game).id));
            
            game.gameState.should.equal(initialGameState);
            game.setState.should.not.have.been.called;
        });
        
        it('Start investigation should set the state to PresidentInvestigatePlayer', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            
            game.startLoyaltyInvestigation();
            
            game.gameState.should.equal(Game.GameStates.PresidentInvestigatePlayer);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should investigate chosen user', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            game.setState(Game.GameStates.PresidentInvestigatePlayer);
            sinon.spy(game, 'setState');
            
            game.investigatePlayer(game.president, chosenUserId);
            
            game.investigatedPlayers.length.should.equal(1);
            game.investigatedPlayers.should.include(chosenPlayer.id);
            game.setState.should.have.been.calledTwice;
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
        });
        
        it('Should not investigate if author is not president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const nonPresidentPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(game.president.id);
            game.setState(Game.GameStates.PresidentInvestigatePlayer);
            sinon.spy(game, 'setState');
            
            game.investigatePlayer(nonPresidentPlayer, chosenUserId);
            
            game.gameState.should.equal(Game.GameStates.PresidentInvestigatePlayer);
            game.setState.should.not.have.been.called;
        });
        
        it('Should not investigate a player that has already been investigated', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            game.setState(Game.GameStates.PresidentInvestigatePlayer);
            sinon.spy(game, 'setState');
            
            game.investigatedPlayers.push(chosenPlayer.id);
            game.investigatePlayer(game.president, chosenUserId);
            
            game.investigatedPlayers.length.should.equal(1);
            game.gameState.should.equal(Game.GameStates.PresidentInvestigatePlayer);
            game.setState.should.not.have.been.called;
        });
        
        it('Should not investigate a player that is dead', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            game.setState(Game.GameStates.PresidentInvestigatePlayer);
            sinon.spy(game, 'setState');
            
            chosenPlayer.isDead = true;
            game.investigatePlayer(game.president, chosenUserId);
            
            game.investigatedPlayers.should.be.empty;
            game.gameState.should.equal(Game.GameStates.PresidentInvestigatePlayer);
            game.setState.should.not.have.been.called;
        });
    });
    
    describe('Special election tests', () => {
         it('Special election should only be allowed if the state is SpeciallyElectPresident', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            const initialGameState = game.gameState;
            
            game.speciallyElectPresident(game.president, createDiscordUserId(getNonPresidentPlayer(game).id));
            
            game.gameState.should.equal(initialGameState);
            game.setState.should.not.have.been.called;
        });
        
        it('Start special election should set the state to SpeciallyElectPresident', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            
            game.startSpecialElection();
            
            game.gameState.should.equal(Game.GameStates.SpeciallyElectPresident);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should specially elect the chosen user', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            const initialPresidentIndex = game.presidentIndex;
            game.setState(Game.GameStates.SpeciallyElectPresident);
            sinon.spy(game, 'setState');
            
            game.speciallyElectPresident(game.president, chosenUserId);
            
            game.president.id.should.equal(chosenPlayer.id);
            game.previousPresidentIndex.should.equal(initialPresidentIndex);
            game.speciallyElectedPresident.should.be.true;
            game.setState.should.have.been.calledTwice;
            game.gameState.should.equal(Game.GameStates.NominateChancellor);
        });
        
        it('Should not specially elect if the author is not the president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const author = getNonPresidentPlayer(game);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            const initialPresidentId = game.president.id;
            game.setState(Game.GameStates.SpeciallyElectPresident);
            sinon.spy(game, 'setState');
            
            game.speciallyElectPresident(author, chosenUserId);
            
            game.president.id.should.equal(initialPresidentId);
            game.speciallyElectedPresident.should.be.false;
            game.setState.should.have.not.been.called;
            game.gameState.should.equal(Game.GameStates.SpeciallyElectPresident);
            should.not.exist(game.previousPresidentIndex);
        });
        
        it('Should not specially elect the president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenUserId = createDiscordUserId(game.president.id);
            const initialPresidentId = game.president.id;
            game.setState(Game.GameStates.SpeciallyElectPresident);
            sinon.spy(game, 'setState');
            
            game.speciallyElectPresident(game.president, chosenUserId);
            
            game.president.id.should.equal(initialPresidentId);
            game.speciallyElectedPresident.should.be.false;
            game.setState.should.have.not.been.called;
            game.gameState.should.equal(Game.GameStates.SpeciallyElectPresident);
            should.not.exist(game.previousPresidentIndex);
        });
        
        it('Should not specially elect a dead player', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            const initialPresidentId = game.president.id;
            chosenPlayer.isDead = true;
            game.setState(Game.GameStates.SpeciallyElectPresident);
            sinon.spy(game, 'setState');
            
            game.speciallyElectPresident(game.president, chosenUserId);
            
            game.president.id.should.equal(initialPresidentId);
            game.speciallyElectedPresident.should.be.false;
            game.setState.should.have.not.been.called;
            game.gameState.should.equal(Game.GameStates.SpeciallyElectPresident);
            should.not.exist(game.previousPresidentIndex);
        });
    });
    
    describe('Execution tests', () => {
         it('Execution should only be allowed if the state is PresidentShootPlayer', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            const initialGameState = game.gameState;
            
            game.shootPlayer(game.president, createDiscordUserId(getNonPresidentPlayer(game).id));
            
            game.gameState.should.equal(initialGameState);
            game.setState.should.not.have.been.called;
        });
        
        it('Start execution should set the state to PresidentShootPlayer', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            sinon.spy(game, 'setState');
            
            game.startExecution();
            
            game.gameState.should.equal(Game.GameStates.PresidentShootPlayer);
            game.setState.should.have.been.calledOnce;
        });
        
        it('Should execute the chosen user', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            let liberalsExpectedToWin = chosenPlayer.isHitler;
            
            game.setState(Game.GameStates.PresidentShootPlayer);
            sinon.spy(game, 'setState');
            
            game.shootPlayer(game.president, chosenUserId);
            
            chosenPlayer.isDead.should.be.true;
            
            if (liberalsExpectedToWin) {
                game.setState.should.have.been.calledOnce;
                game.gameState.should.equal(Game.GameStates.Finished);
                game.gameRunning.should.be.false;
            } else {            
                game.setState.should.have.been.calledTwice;
                game.gameState.should.equal(Game.GameStates.NominateChancellor);
            }
        });
        
        it('Should not shoot if the author is not the president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const author = getNonPresidentPlayer(game);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            
            game.setState(Game.GameStates.PresidentShootPlayer);
            sinon.spy(game, 'setState');
            
            game.shootPlayer(author, chosenUserId);
            
            chosenPlayer.isDead.should.be.false;
            game.gameState.should.equal(Game.GameStates.PresidentShootPlayer);
            game.setState.should.not.have.been.called;
        });
        
        it('Should not shoot the president', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenUserId = createDiscordUserId(game.president.id);
            const initialPresidentId = game.president.id;
            game.setState(Game.GameStates.PresidentShootPlayer);
            sinon.spy(game, 'setState');
            
            game.shootPlayer(game.president, chosenUserId);
            
            game.president.isDead.should.be.false;
            game.gameState.should.equal(Game.GameStates.PresidentShootPlayer);
            game.setState.should.not.have.been.called;
        });
        
        it('Should not shoot a dead player', () => {
            const game = new Game(client);
            game.startGame(null, message);
            const chosenPlayer = getNonPresidentPlayer(game);
            const chosenUserId = createDiscordUserId(chosenPlayer.id);
            chosenPlayer.isDead = true;
            
            game.setState(Game.GameStates.PresidentShootPlayer);
            sinon.spy(game, 'setState');
            
            game.shootPlayer(game.president, chosenUserId);
            
            game.gameState.should.equal(Game.GameStates.PresidentShootPlayer);
            game.setState.should.not.have.been.called;
        });
    });
    
    describe('Facist win condition tests', () => {
        it('Should win if 6 facist policies are enacted', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.gameBoard.facistPolicies = 5;
            
            game.doFacistsWin().should.be.false;
            
            game.gameBoard.facistPolicies = 6;
            
            game.doFacistsWin().should.be.true;
        });
        
        it('Should win if Hitler is elected chancellor and 3 facist policies have been enacted', () => {
            const game = new Game(client);
            game.startGame(null, message);            
            const nonHitler = game.players.find(p => !p.isHitler);            
            const hitler = game.players.find(p => p.isHitler);
            
            game.gameBoard.facistPolicies = 2;
            game.chancellor = nonHitler;
            game.doFacistsWin().should.be.false;
            
            game.chancellor = hitler;
            game.doFacistsWin().should.be.false;
            
            game.gameBoard.facistPolicies = 3;
            game.chancellor = nonHitler;
            game.doFacistsWin().should.be.false;
            
            game.chancellor = hitler;       
            game.doFacistsWin(true).should.be.true;
        });
    });
    
    describe('Liberal win condition tests', () => {
        it('Should win if 5 liberal policies are enacted', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            game.gameBoard.liberalPolicies = 4;
            
            game.doLiberalsWin().should.be.false;
            
            game.gameBoard.liberalPolicies = 5;
            
            game.doLiberalsWin().should.be.true;
        });
        
        it('Should win if Hitler is killed', () => {
            const game = new Game(client);
            game.startGame(null, message);        
            const hitler = game.players.find(p => p.isHitler);
            
            game.doLiberalsWin().should.be.false;
            
            hitler.isDead = true;
            game.doLiberalsWin().should.be.true;
        });
    });

    describe('Semi end-to-end Facist win condition tests', () => {
        it('Should win if 6 facist policies are enacted', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            
            for(var i = 0; i < 5; i++) {
                game.enactPolicy(Game.Policies.Facist);
            }
            
            game.doFacistsWin().should.be.false;
            game.facistsWon.should.be.false;
            game.gameBoard.NumOfFacistPolicies.should.equal(5);
            
            game.enactPolicy(Game.Policies.Facist);
            
            game.facistsWon.should.be.true;
            game.gameRunning.should.be.false;
            game.gameState.should.equal(Game.GameStates.Finished);
        });
        
        it('Should win if Hitler is elected chancellor and 3 facist policies have been enacted', () => {
            const game = new Game(client);
            game.startGame(null, message);           
            const hitler = game.players.find(p => p.isHitler);
            
            while(game.president.isHitler) {
                game.president = getNonPresidentPlayer(game);
            }
            
            for(var i = 0; i < 3; i++) {
                game.enactPolicy(Game.Policies.Facist);
            }
            
            game.facistsWon.should.be.false;
            game.gameBoard.NumOfFacistPolicies.should.equal(3);
            
            game.nominatedChancellor = hitler;
            game.electChancellor();
            
            game.facistsWon.should.be.true;
            game.gameRunning.should.be.false;
            game.gameState.should.equal(Game.GameStates.Finished);
        });
        
        it('Should not win if 3rd facist policy is enacted while Hitler is current chancellor', () => {
            const game = new Game(client);
            game.startGame(null, message);            
            const nonHitler = game.players.find(p => !p.isHitler);            
            const hitler = game.players.find(p => p.isHitler);
            
            while(game.president.isHitler) {
                game.president = getNonPresidentPlayer(game);
            }
            
            for(var i = 0; i < 2; i++) {
                game.enactPolicy(Game.Policies.Facist);
            }
            
            game.nominatedChancellor = hitler;
            game.electChancellor();
            
            game.facistsWon.should.be.false;
            game.gameBoard.NumOfFacistPolicies.should.equal(2);
            game.chancellor.isHitler.should.be.true;
            
            game.enactPolicy(Game.Policies.Facist);
            
            game.facistsWon.should.be.false;
            game.gameRunning.should.be.true;
        });
    });

    describe('Semi end-to-end Liberal win condition tests', () => {
        it('Should win if 5 liberal policies enacted', () => {
            const game = new Game(client);            
            game.startGame(null, message);
            
            for(var i = 0; i < 4; i++) {
                game.enactPolicy(Game.Policies.Liberal);
            }
            
            game.liberalsWon.should.be.false;
            game.gameRunning.should.be.true;
            game.gameBoard.NumOfLiberalPolicies.should.equal(4);
            
            game.enactPolicy(Game.Policies.Liberal);
            
            game.liberalsWon.should.be.true;
            game.gameRunning.should.be.false;
            game.gameState.should.equal(Game.GameStates.Finished);
        });
        
        it('Should win if hitler is killed', () => {
            const game = new Game(client);            
            game.startGame(null, message);                
            //const hitler = game.players.find(p => p.isHitler);
            
            for(var i = 0; i < 4; i++) {
                game.enactPolicy(Game.Policies.Facist);
            }
            
            game.president = game.players.find(p => !p.isHitler);
            game.president.isHitler.should.not.be.true;
            
            game.gameState.should.equal(Game.GameStates.PresidentShootPlayer);
            game.shootPlayer(game.president, createDiscordUserId(game.hitler.id));
            
            game.hitler.isDead.should.be.true;
            game.liberalsWon.should.be.true;
            game.gameRunning.should.be.false;
            game.gameState.should.equal(Game.GameStates.Finished);
        });
    });
});