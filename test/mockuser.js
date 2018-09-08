'use strict'

const getRandomInt = function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
};

class MockUser {
    constructor() {
        this.id = getRandomInt(10000).toString();
        this.nickname = `mock_user ${this.id}`;
    }
    
    send(msg) {
    }
}

export default MockUser;