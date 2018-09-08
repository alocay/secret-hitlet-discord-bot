'use strict'

import chai from 'chai';
import sinon from 'sinon';
import Gameboard from '../src/gameboard.js';

const should = chai.should();

describe('Tests for the gameboard', () => {
	
	const checkExecutiveActions5_6 = function(gameboard) {
		gameboard.facistPolicies = 0;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.None);
		
		gameboard.facistPolicies = 1;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.None);
		
		gameboard.facistPolicies = 2;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.None);
		
		gameboard.facistPolicies = 3;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.PolicyPeek);
		
		gameboard.facistPolicies = 4;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.Execution);
		
		gameboard.facistPolicies = 5;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.Execution);
	};
	
	const checkExecutiveActions7_8 = function(gameboard) {
		gameboard.facistPolicies = 0;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.None);
		
		gameboard.facistPolicies = 1;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.None);
		
		gameboard.facistPolicies = 2;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.InvestigateLoyalty);
		
		gameboard.facistPolicies = 3;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.SpecialElection);
		
		gameboard.facistPolicies = 4;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.Execution);
		
		gameboard.facistPolicies = 5;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.Execution);
	};
	
	const checkExecutiveActions9_10 = function(gameboard) {
		gameboard.facistPolicies = 0;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.None);
		
		gameboard.facistPolicies = 1;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.InvestigateLoyalty);
		
		gameboard.facistPolicies = 2;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.InvestigateLoyalty);
		
		gameboard.facistPolicies = 3;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.SpecialElection);
		
		gameboard.facistPolicies = 4;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.Execution);
		
		gameboard.facistPolicies = 5;
		gameboard.getUnlockedExecutiveAction().should.equal(Gameboard.PresidentialPowers.Execution);
	};
	
	it('Should use the correct gameboard', () => {
		const gameboard = new Gameboard(5);
		gameboard.gameboardType.should.equal(gameboard.PlayerBoard5_6);
		
		gameboard.getGameboardType(6).should.equal(gameboard.PlayerBoard5_6);
		gameboard.getGameboardType(7).should.equal(gameboard.PlayerBoard7_8);
		gameboard.getGameboardType(8).should.equal(gameboard.PlayerBoard7_8);
		gameboard.getGameboardType(9).should.equal(gameboard.PlayerBoard9_10);
		gameboard.getGameboardType(10).should.equal(gameboard.PlayerBoard9_10);
		
		should.not.exist(gameboard.getGameboardType(11));
	});
	
	it('Should enact facist policies', () => {
		const gameboard = new Gameboard(5);
		gameboard.facistPolicies.should.equal(0);
		
		gameboard.enactFacistPolicy();
		gameboard.facistPolicies.should.equal(1);
		gameboard.enactFacistPolicy();
		gameboard.facistPolicies.should.equal(2);
	});
	
	it('Should enact liberal policies', () => {
		const gameboard = new Gameboard(5);
		gameboard.liberalPolicies.should.equal(0);
		
		gameboard.enactLiberalPolicy();
		gameboard.liberalPolicies.should.equal(1);
		gameboard.enactLiberalPolicy();
		gameboard.liberalPolicies.should.equal(2);
	});
	
	it('Should increase the election tracker', () => {
		const gameboard = new Gameboard(5);
		gameboard.govtRejectCount.should.equal(0);
		
		gameboard.increaseElectionTracker();
		gameboard.govtRejectCount.should.equal(1);
		gameboard.increaseElectionTracker();
		gameboard.govtRejectCount.should.equal(2);
	});
	
	it('Should reset the election tracker', () => {
		const gameboard = new Gameboard(5);
		
		gameboard.increaseElectionTracker();
		gameboard.increaseElectionTracker();
		
		gameboard.govtRejectCount.should.not.equal(0);
		gameboard.resetElectionTracker();
		gameboard.govtRejectCount.should.equal(0);
	});
	
	it('Should check if veto is unlocked', () => {
		const gameboard = new Gameboard(5);
		
		gameboard.liberalPolicies.should.equal(0);
		gameboard.isVetoUnlocked().should.equal(false);
		gameboard.facistPolicies = 5;		
		gameboard.isVetoUnlocked().should.equal(true);
	});
	
	it('Should get unlocked 5-6 player executive action', () => {
		let gameboard = new Gameboard(5);		
		checkExecutiveActions5_6(gameboard);

		gameboard = new Gameboard(6);		
		checkExecutiveActions5_6(gameboard);
	});
	
	it('Should get unlocked 7-8 player executive action', () => {
		let gameboard = new Gameboard(7);		
		checkExecutiveActions7_8(gameboard);

		gameboard = new Gameboard(8);		
		checkExecutiveActions7_8(gameboard);
	});
	
	it('Should get unlocked 9-10 player executive action', () => {
		let gameboard = new Gameboard(9);
		checkExecutiveActions9_10(gameboard);
		
		gameboard = new Gameboard(10);
		checkExecutiveActions9_10(gameboard);
	});
});