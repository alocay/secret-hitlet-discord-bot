"use strict";

class Gameboard {
    constructor(numOfPlayers) 
    {
        this.facistPolicies = 0;
        this.liberalPolicies = 0;
        this.govtRejectCount = 0;
        
        this.PlayerBoard5_6 = [
            Gameboard.PresidentialPowers.None,
            Gameboard.PresidentialPowers.None,
            Gameboard.PresidentialPowers.PolicyPeek,
            Gameboard.PresidentialPowers.Execution,
            Gameboard.PresidentialPowers.Execution,
        ];
        
        this.PlayerBoard7_8 = [
            Gameboard.PresidentialPowers.None,
            Gameboard.PresidentialPowers.InvestigateLoyalty,
            Gameboard.PresidentialPowers.SpecialElection,
            Gameboard.PresidentialPowers.Execution,
            Gameboard.PresidentialPowers.Execution,
        ];
        
        this.PlayerBoard9_10 = [
            Gameboard.PresidentialPowers.InvestigateLoyalty,
            Gameboard.PresidentialPowers.InvestigateLoyalty,
            Gameboard.PresidentialPowers.SpecialElection,
            Gameboard.PresidentialPowers.Execution,
            Gameboard.PresidentialPowers.Execution,
        ];
        
        this.gameboardType = this.getGameboardType(numOfPlayers);
    }
    
    getGameboardType(numOfPlayers) {
        if (numOfPlayers <= 6) {
            return this.PlayerBoard5_6;
        } else if (numOfPlayers <= 8) {
            return this.PlayerBoard7_8;
        } else if (numOfPlayers <= 10) {
            return this.PlayerBoard9_10;
        }
        
        return null;
    }
    
    enactFacistPolicy() {
        this.facistPolicies++;
    }
    
    enactLiberalPolicy() {
        this.liberalPolicies++;
    }
    
    increaseElectionTracker() {
        this.govtRejectCount++;
    }
    
    resetElectionTracker() {
        this.govtRejectCount = 0;
    }
    
    isVetoUnlocked() {
        return this.facistPolicies === 5;
    }
    
    getUnlockedExecutiveAction() {
        if (this.facistPolicies === 0) return Gameboard.PresidentialPowers.None;
        return this.gameboardType[this.facistPolicies - 1];
    }
    
    getGameboardDisplay() {
        let info = `Facist Policies: ${this.facistPolicies}\n`;
        info += `Liberal Policies: ${this.liberalPolicies}\n`;
        info += `Rejected Govts: ${this.govtRejectCount} (policy enacted at 3)\n\n`;
        return info;
    }
    
    get NumOfFacistPolicies() {
        return this.facistPolicies;
    }
    
    get NumOfLiberalPolicies() {
        return this.liberalPolicies;
    }
    
    get NumOfRejectedGovts() {
        return this.govtRejectCount;
    }
    
    static get PresidentialPowers() {
        return {
            None: 0,
            PolicyPeek: 1,
            InvestigateLoyalty: 2,
            SpecialElection: 3,
            Execution: 4
        };
    }
}

export default Gameboard;