'use strict'

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockUser from './mockuser.js';
import Game from '../src/game.js';
const { cmd_channel } = require('../src/config.json');

const should = chai.should();

const getRandomInt = function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
};
	
const createDiscordUserId = function createDiscordUserId(id) {
	return `<@!${id}>`;
};

chai.use(sinonChai);

describe('Tests for the game logic', () => {
	let message = {};
	let client = {};
	let channels = [];
	let voiceChannel = {};
	let cmdChannel = {};
	let mockUsers = [];
	const numOfPlayers = 5;
	const voiceChannelId = 'mock_voice_channel';
	
	const getNonPresidentPlayer = function getNonPresidentPlayer(game) {
		let nominatedIndex = getRandomInt(numOfPlayers);
		
		while (nominatedIndex === game.presidentIndex) {
			nominatedIndex = getRandomInt(numOfPlayers);
		}
		
		return game.players[nominatedIndex];
	};
	
	before(() => {		
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
			channels: {
				get: function (id) { return channels.find(c => c.id === id); }
			},
			users: {
				get: function (id) { return mockUsers.find(u => u.id === id); }
			}
		};
	});
	
	it('Should setup the game', () => {
		const game = new Game(client);
		
		sinon.spy(game, 'setState');
		
		game.startGame(null, message);
		
		game.gameRunning.should.be.true;
		
		game.gameBoard.should.exist;
		game.deck.should.exist;
		game.deck.length.should.equal(18);
		game.membershipDeck.should.exist;
		
		game.players.length.should.equal(numOfPlayers);
		
		game.liberals.length.should.equal(numOfPlayers - 2);
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
	
	describe('Nomination voting tests', () => {
		it('Should elect the chancellor if the jas have a majority', () => {
			const game = new Game(client);
			
			game.startGame(null, message);
			const nonPresidentPlayer = getNonPresidentPlayer(game);
			
			game.nominatedChancellor = nonPresidentPlayer;
			game.setState(Game.GameStates.VoteOnNomination);
			
			game.players.forEach(p => game.voteOnNomination(p, 'ja'));
			
			game.votes.count.should.equal(game.players.length);
			game.chancellor.id.should.equal(nonPresidentPlayer.id);
			should.not.exist(game.nominatedChancellor);
			game.gameState.should.equal(Game.GameStates.PresidentDrawPolicies);
		});
	});
});