"use strict";

class Player {
    constructor() {
        this.membership = null;
        this.isChancellor = false;
        this.isPresident = false;
        this.isHitler = false;
        this.isFacist = false;
        this.isLiberal = false;
        this.hasDrawn = false;
    }
    
    assignMembership(membership) {
        this.membership = membership;
        this.isHitler = membershipship.role == Membership.Roles.Hitler;
        this.isFacist = membershipship.party == Membership.Roles.Facist;
        this.isLiberal = membershipship.party == Membership.Roles.Liberal;
    }
    
    canDraw() {
        return this.isPresident && !this.hasDrawn;
    }
}