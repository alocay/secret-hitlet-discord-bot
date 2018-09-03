"use strict";

const 5_6PlayerBoard = [
    Gameboard.PresidentialPowers.None,
    Gameboard.PresidentialPowers.None,
    Gameboard.PresidentialPowers.PolicyPeek,
    Gameboard.PresidentialPowers.Execution,
    Gameboard.PresidentialPowers.Execution,
];

const 7_8PlayerBoard = [
    Gameboard.PresidentialPowers.None,
    Gameboard.PresidentialPowers.InvestigateLoyalty,
    Gameboard.PresidentialPowers.SpecialElection,
    Gameboard.PresidentialPowers.Execution,
    Gameboard.PresidentialPowers.Execution,
];

const 9_10PlayerBoard = [
    Gameboard.PresidentialPowers.InvestigateLoyalty,
    Gameboard.PresidentialPowers.InvestigateLoyalty,
    Gameboard.PresidentialPowers.SpecialElection,
    Gameboard.PresidentialPowers.Execution,
    Gameboard.PresidentialPowers.Execution,
];

class Gameboard {
    constructor(numOfPlayers) 
    {
        this.numOfPlayers = numOfPlayers;
        this.gameboardType = getGameboardType(numOfPlayers);
        this.facistPolices = 0;
        this.liberalPolices = 0;
        this.govtRejectCount = 0;   
    }
    
    getGameboardType(numOfPlayers) {
        if (numOfPlayers <= 6) {
            return 5_6PlayerBoard;
        } else if (numOfPlayers <= 8) {
            return 7_8PlayerBoard;
        } else if (numOfPlayers <= 10) {
            return 9_10PlayerBoard;
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
        if (facistPolices == 0) return Gameboard.PresidentialPowers.None;
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