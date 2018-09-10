"use strict";

import Membership from './membership.js';
import EmbeddedMessage from './message.js';

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
        const membershipInfo = new EmbeddedMessage(this.nickname, 'Membership Information', ' \n-----------------------------------------', Membership.GetPartyColor(this.membership.party));
        membershipInfo.addLine('Party:', `${Membership.GetPartyString(this.membership.party)}`);
        membershipInfo.addLine('Role:', `${Membership.GetRoleString(this.membership.role)}`);
        membershipInfo.addThumbnail(Membership.GetRoleThumbnail(this.membership.role));
        
        if (!this.isHitler && this.isFacist) {
             membershipInfo.addLine('Hitler:', `${hitler ? hitler.nickname : 'null'} is Hitler`);
        }
        
        if ((this.isHitler && doesHitlerKnow) || (!this.isHitler && this.isFacist)) {
            
            membershipInfo.addLine('Facist partners:', facists.map(f => f.nickname).join('\n'));
        }
        
        return membershipInfo;
    }
    
    canDraw() {
        return this.isPresident && !this.hasDrawn;
    }
    
    canDiscard() {
        returnt (this.isPresident || this.isChancellor) && this.hasPoliciesToDiscard && !this.hasDiscarded;
    }
    
    
}

export default Player;