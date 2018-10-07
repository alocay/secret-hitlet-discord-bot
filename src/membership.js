"use strict";

const HitlerRoleCard = "https://i.imgur.com/9vVwdqY.png";
const FacistRoleCard = "https://i.imgur.com/cchoOFd.png";
const LiberalRoleCard = "https://i.imgur.com/jKCjkPj.png";

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
    
    static GetPartyColor(party) {
        let color = null;
        
        switch(party) {
            case Membership.Parties.Liberal:
                color = 'BLUE';
                break;
            case Membership.Parties.Facist:
                color = 'RED';
                break;
        }
        
        return color;
    }
    
    static GetRoleThumbnail(role) {
        let thumbnail = null;
        
        switch(role) {
            case Membership.Roles.Liberal:
                thumbnail = LiberalRoleCard;
                break;
            case Membership.Roles.Facist:
                thumbnail = FacistRoleCard;
                break;
            case Membership.Roles.Hitler:
                thumbnail = HitlerRoleCard;
                break;
        }
        
        return thumbnail;
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