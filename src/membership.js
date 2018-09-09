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
        let roleString = '';
        
        switch(role) {
            case Membership.Roles.Liberal:
                roleString = 'Liberal';
                break;
            case Membership.Roles.Facist:
                roleString = 'Facist';
                break;
            case Membership.Roles.Hitler:
                roleString = 'Hitler'
                break;
        }
        
        return roleString;
    }
    
    static GetPartyString(party) {
        let partyString = '';
        
        switch(party) {
            case Membership.Parties.Liberal:
                partyString = 'Liberal';
                break;
            case Membership.Parties.Facist:
                partyString = 'Facist';
                break;
        }
        
        return partyString;
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