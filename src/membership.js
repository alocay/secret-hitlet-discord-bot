"use strict";

class Membership {
    constructor(party, role) 
    {
        this.party = party;
        this.role = role;
    }
    
    static get Parties() {
        return {
            Liberal: 0,
            Facist: 1
        }
    }
    
    static get Roles() {
        return {
            Liberal: 0,
            Facist: 1,
            Hitler: 3
        }
    }
    
    static GetRoleString(role) {
        switch(role) {
            case Membership.Roles.Liberal:
                return 'Liberal';
                break;
            case Membership.Roles.Facist:
                return 'Facist';
                break;
            case Membership.Roles.Hitler:
                return 'Hitler'
                break;
        }
        
        return '';
    }
    
    static GetPartyString(party) {
        switch(party) {
            case Membership.Parties.Liberal:
                return 'Liberal';
                break;
            case Membership.Parties.Facist:
                return 'Facist';
                break;
        }
        
        return '';
    }
    
    static CreateLiberal() {
        return new Membership(Membership.Parties.Liberal, Membership.Roles.Liberal);
    }
    
    static CreateFacist() {
        return new Membership(Membership.Parties.Facist, Membership.Roles.Facist);
    }
    
    static CreateHitler() {
        return new Membership(Membership.Parties.Facist, Membership.Roles.Hitler);
    }
}

export default Membership;