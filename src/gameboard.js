"use strict";

const GameboardVisuals = {
    "facist5_6": [
        "https://i.imgur.com/7omhO5Jl.png",
        "https://i.imgur.com/ztIx9Ocl.png",
        "https://i.imgur.com/17KMpN4l.png",
        "https://i.imgur.com/agdxUvql.png",
        "https://i.imgur.com/Ir0yEsp.png",
        "https://i.imgur.com/HJc4upq.png"
    ],
    "facist7_8": [
        "https://i.imgur.com/T0Z3gkwl.png",
        "https://i.imgur.com/s6stk9el.png",
        "https://i.imgur.com/0bEt2Dxl.png",
        "https://i.imgur.com/Y4x1Zfvl.png",
        "https://i.imgur.com/KwPjqJLl.png",
        "https://i.imgur.com/ZUqiKTFl.png"
    ],
    "facist9_10": [
        "https://i.imgur.com/NfWbBTm.png",
        "https://i.imgur.com/4KWbg03.png",
        "https://i.imgur.com/0vc1Uuv.png",
        "https://i.imgur.com/ONdxw2A.png",
        "https://i.imgur.com/G1qWdfB.png",
        "https://i.imgur.com/FlZTOLp.png"
    ],
    "liberal": [
        "https://i.imgur.com/Ve9Epa6.png",
        "https://i.imgur.com/UqqqgQV.png",
        "https://i.imgur.com/9jeV1Bp.png",
        "https://i.imgur.com/H516JHw.png",
        "https://i.imgur.com/ZBPzI3W.png"
    ]
}

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
    
    getFacistBoardVisual() {
        if (this.facistPolicies < 0 || this.facistPolicies > 5) return null;
        
        if (numOfPlayers <= 6) {
            return GameboardVisuals.facist5_6[this.facistPolicies];
        } else if (numOfPlayers <= 8) {
            return GameboardVisuals.facist7_8[this.facistPolicies];
        } else if (numOfPlayers <= 10) {
            return GameboardVisuals.facist9_10[this.facistPolicies];
        }
        
        return null;
    }
    
    getLiberalBoardVisual() {
        if (this.liberalPolicies < 0 || this.liberalPolicies > 4) return null;
        
        return GameboardVisuals.liberal[this.liberalPolicies];
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