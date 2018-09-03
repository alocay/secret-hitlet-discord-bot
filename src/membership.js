
class Memebership {
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
    
    static CreateLiberal() {
        return new Memebership(Membership.Party.Liberal, Membership.Roles.Liberal);
    }
    
    static CreateFacist() {
        return new Memebership(Membership.Party.Facist, Membership.Roles.Facist);
    }
    
    static CreateHitler() {
        return new Memebership(Membership.Party.Facist, Membership.Roles.Hitler);
    }
}