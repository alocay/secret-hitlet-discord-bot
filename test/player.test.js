'use strict'

import chai from 'chai';
import Membership from '../src/membership.js';
import Player from '../src/player.js';

const should = chai.should();

describe('Tests for player', () => {
    let user = null;
    let liberalMembership = null;
    let facistMembership = null;
    let hitlerMembership = null;
    
    before(() => {
        user = { id: '123456789', nickname: 'mock_user' };
        liberalMembership = new Membership(Membership.Parties.Liberal, Membership.Roles.Liberal);
        facistMembership = new Membership(Membership.Parties.Facist, Membership.Roles.Facist);
        hitlerMembership = new Membership(Membership.Parties.Facist, Membership.Roles.Hitler);
    });
    
    it('Should create a player with default values', () => {
        const player = new Player(user);
        player.id.should.equal(user.id);
        player.nickname.should.equal(user.nickname);
        should.not.exist(player.membership);
    });
    
    it('Should assign liberal membership', () => {
        const player = new Player(user);
        player.assignMembership(liberalMembership);
        should.exist(player.membership);
        player.isLiberal.should.equal(true);
        player.isFacist.should.equal(false);
        player.isHitler.should.equal(false)
    });
    
    it('Should assign facist membership', () => {
        const player = new Player(user);
        player.assignMembership(facistMembership);
        should.exist(player.membership);
        player.isLiberal.should.equal(false);
        player.isFacist.should.equal(true);
        player.isHitler.should.equal(false)
    });
    
    it('Should assign hitler membership', () => {
        const player = new Player(user);
        player.assignMembership(hitlerMembership);
        should.exist(player.membership);
        player.isLiberal.should.equal(false);
        player.isFacist.should.equal(true);
        player.isHitler.should.equal(true)
    });
});