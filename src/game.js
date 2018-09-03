'use strict';

const facistPolicies = 11;
const liberalPolicies = 7;


const shuffle = function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }

    return a;
};

const getRandomInt = function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
};

class Game {
    constructor(client) {
        this.client = client;
        this.deck = [];
        this.membershipDeck = [];
        this.discardPile = [];
        this.players = [];
        this.president = null;
        this.channcelor = null;
        this.liberals = [];
        this.facists = [];
        this.hitler = null;
        this.previousGovernment = [];
        this.govtRejectCount = 0;
        this.facistPolices = 0;
        this.liberalPolices = 0;
        this.gameRunning = false;
        this.drawnPolicies = [];
    }
    
    getPlayers(playerIds) {       
        
    }
    
    function getAllPlayersInAuthorsChannel(author) {
        var voiceChannelId = author.lastMessage.member.voiceChannelID;
        var voiceChannel = this.client.channels.get(voiceChannelId);
        return voiceChannel.members;
        
        /*const mem = vc.members.map(x => x.nickname);    
        mem.unshift('Members:\n');
        mem.join('');*/
    }
    
    createMemberships() {
        let numOfFacists = 2;
        if (this.players.length > 6 && this.players.length < 9) {
            numOfFacists = 3;
        } else if (this.players.length >= 9) {
            numOfFacists = 4;
        }
        
        this.addFacistMemberships(numOfFacists);
        this.addLiberalMemberships(this.players.length - numOfFacists);
        this.membershipDeck = shuffle(this.membershipDeck);
    }
    
    addFacistMemberships(numOfFacists) {
        for(var i = 0; i < (numOfFacists - 1); i++) {
            this.membershipDeck.push(Membership.CreateFacist());
        }
        
        this.membershipDeck.push(Membership.CreateHitler());
    }
    
    addLiberalMemberships(numOfLiberals) {
        for(var i = 0; i < numOfLiberals; i++) {
            this.membershipDeck.push(Membership.CreateLiberal());
        }
    }
    
    createDeck() {
        for (var i = 0; i < facistPolicies; i++) {
            this.deck.push('F');
        }

        for (var i = 0; i < liberalPolicies; i++) {
            this.deck.push('L');
        }

        this.shuffleDeck();
    }

    shuffleDeck() {
        this.deck = shuffle(this.deck);
    }
    
    shufflePlayerOrder() {
        this.players = shuffle(this.players);
    }
    
    assignMemberships() {
        for(var i = 0; i < this.players.length; i++) {
            this.players.assignMembership(this.membershipDeck.pop());
        }
    }
    
    assignRandomPresident() {
        this.president = getRandomInt(this.players.length);
    }
    
    assignNextPresident() {
        this.president = (this.president + 1) % this.players.length;
    }
    
    nominateChancellor() {
    }

    electChancellor() {
        if (doFacistsWin()) {
            // They win!
        }
    }
    
    rejectNomination() {
    }
    
    drawPolicies(player) {
        this.drawnPolicies = this.deck.slice(0, 3);
    }
    
    discardPolicy(policy) {
    }
    
    enactPolicy() {
        if (doFacistsWin()) {
            // Facists win!
        }
        
        if (doLiberalsWin()) {
            // Liberals win!
        }
    }
    
    shootPlayer(player) {
        if (doLiberalsWin()) {
            // Liberals win!
        }
    }
    
    doFacistsWin() {
        return this.facistPolices == 6;
    }
    
    doLiberalsWin() {
        return this.liberalPolices == 5;
    }
    
    startGame(players, message) {
        if (!this.client) return;
        
        if (!players) {
            this.getAllPlayersInAuthorsChannel(message.author);
        } else {
            const playersArray = players.split(" ");
            const playerIds = playersArray.map(u => u.replace(/[<@!>]/g, ''));
        }
        
        this.getPlayers(playerIds);
        this.createMemberships();
        this.createDeck();
        this.shufflePlayerOrder();
        this.assignMemberships();
        this.assignRandomPresident();
    }
    
    static get Commands() {
        return [
            {
                name: 'play',
                alias: 'start',
                description: 'Starts a new game',
                usage: '!play <optional list of players>',
                example: '!play @Squid#3288, @vagen#5010',
                action: 'startGame'
            },
            {
                name: 'draw',
                description: 'Draws three policy cards',
                usage: '!draw',
                action: 'drawPolicies'            
            },
            {
                name: 'discard',
                description: 'Discards the specified card',
                usage: '!discard <card # to discard>',
                usage: '!discard 1',
                action: 'discardPolicy'            
            },
            {
                name: 'veto',
                description: 'Initates a veto of the current policies (if allowed)',
                usage: '!veto',
                action: 'vetoPolicies'            
            },
            {
                name: 'info',
                description: 'Displays the status of enacted policies, number of policy cards left, and the current Election Tracker status',
                usage: '!info',
                action: 'showGameStateInfo'            
            },
            {
                name: 'shoot',
                description: 'Shoots the specified player (if allowed)',
                usage: '!shoot <player>',
                example: '!shoot @Squid#3288',
                action: 'shootPlayer'            
            }
        ];
    }
}

export default Game;