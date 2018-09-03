"use strict";

import Membership from './membership.js';

class Player {
    constructor(user) {
        this.user = user;
        this.id = user.id;
        this.nickname = user.nickname;
        this.membership = null;
        this.isChancellor = false;
        this.isPresident = false;
        this.isHitler = false;
        this.isFacist = false;
        this.isLiberal = false;
        this.hasDrawn = false;
        this.hasDiscarded = false;
        this.hasPoliciesToDiscard = false;
        this.isDead = false;
    }
    
    assignMembership(membership) {
        this.membership = membership;
        this.isHitler = membership.role == Membership.Roles.Hitler;
        this.isFacist = membership.party == Membership.Roles.Facist;
        this.isLiberal = membership.party == Membership.Roles.Liberal;
    }
    
    resetAllowances() {
        this.hasDrawn = false;
        this.hasDiscarded = false;
        this.hasPoliciesToDiscard = false;
    }
    
    getPartyMembershipInfo() {
        let info = `The following is the party membership info for ${this.nickname}\n\n`;
        info += `Party: ${Membership.GetPartyString(this.membership.party)}`;
    }
    
    getFullMembershipInfo(hitler, facists, doesHitlerKnow) {        
        let info = 'Here is your party/role info:\n';
        info += '-------------------------------------\n\n';
        info += `Party: ${Membership.GetPartyString(this.membership.party)}\n`;
        info += `Role: ${Membership.GetRoleString(this.membership.role)}\n\n`;
        
        if (this.isHitler && doesHitlerKnow) {
            info += 'The following are your Facist partners:\n';
            
            for(var i = 0; i < facists.length; i++) {
                info += `${facists[i].nickname}\n`;
            }
        } else if (this.isFacist) {
            info += `${hitler ? hitler.nickname : 'null'} is Hitler`;
        }
        
        return info;
    }
    
    canDraw() {
        return this.isPresident && !this.hasDrawn;
    }
    
    canDiscard() {
        returnt (this.isPresident || this.isChancellor) && this.hasPoliciesToDiscard && !this.hasDiscarded;
    }
}

export default Player;