'use strict'

import chai from 'chai';
import Membership from '../src/membership.js';

const should = chai.should();

describe('Tests for membership', () => {	
	before(() => {
	});
	
	it('Should create memberships', () => {
		const memLib = new Membership(Membership.Parties.Liberal, Membership.Roles.Liberal);
		const memFac = new Membership(Membership.Parties.Facist, Membership.Roles.Facist);
		const memHit = new Membership(Membership.Parties.Facist, Membership.Roles.Hitler);
		
		memLib.party.should.equal(Membership.Parties.Liberal);
		memLib.role.should.equal(Membership.Roles.Liberal);
		
		memFac.party.should.equal(Membership.Parties.Facist);
		memFac.role.should.equal(Membership.Roles.Facist);
		
		memHit.party.should.equal(Membership.Parties.Facist);
		memHit.role.should.equal(Membership.Roles.Hitler);
	});
	
	it('Should create a liberal membership', () => {
		const mem = Membership.CreateLiberal();
		mem.party.should.equal(Membership.Parties.Liberal);
		mem.role.should.equal(Membership.Roles.Liberal);
	});
	
	it('Should create a facist membership', () => {
		const mem = Membership.CreateFacist();
		mem.party.should.equal(Membership.Parties.Facist);
		mem.role.should.equal(Membership.Roles.Facist);
	});
	
	it('Should create a hitler membership', () => {
		const mem = Membership.CreateHitler();
		mem.party.should.equal(Membership.Parties.Facist);
		mem.role.should.equal(Membership.Roles.Hitler);
	});
	
	it('Should get the correct party string', () => {
		Membership.GetPartyString(Membership.Parties.Liberal).should.equal('Liberal');
		Membership.GetPartyString(Membership.Parties.Facist).should.equal('Facist');
	});
	
	it('Should get the correct role string', () => {
		Membership.GetRoleString(Membership.Roles.Liberal).should.equal('Liberal');
		Membership.GetRoleString(Membership.Roles.Facist).should.equal('Facist');
		Membership.GetRoleString(Membership.Roles.Hitler).should.equal('Hitler');
	});
});