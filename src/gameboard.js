"use strict";

class Gameboard {
    constructor(numOfPlayers) 
    {
        this.gameboardType = this.getGameboardType(numOfPlayers);
        this.facistPolices = 0;
        this.liberalPolices = 0;
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
        this.facistPolices++;
    }
    
    enactLiberalPolicy() {
        this.liberalPolices++;
    }
    
    increaseElectrionTracker() {
        this.govtRejectCount++;
    }
    
    resetElectionTracker() {
        this.govtRejectCount = 0;
    }
    
    isVetoUnlocked() {
        return this.facistPolices === 5;
    }
    
    getUnlockedExecutionAction() {
        if (this.facistPolices === 0) return Gameboard.PresidentialPowers.None;
        return this.gameboardType[this.facistPolices - 1];
    }
    
    getGameboardDisplay() {
        let info = `Facist Policies: ${this.facistPolices}\n`;
        info += `Liberal Policies: ${this.liberalPolices}\n`;
        info += `Rejected Govts: ${this.govtRejectCount} (policy enacted at 3)\n\n`;
        return info;
    }
    
    get NumOfFacistPolicies() {
        return this.facistPolices;
    }
    
    get NumOfLiberalPolicies() {
        return this.liberalPolices;
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