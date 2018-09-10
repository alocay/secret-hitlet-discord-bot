'use strict'

import chai from 'chai';
import EmbeddedMessage from '../src/message.js';

const should = chai.should();

describe('Tests for embedded message', () => {
    const mockAuthor = 'mock author';
    const mockTitle = 'mock title';
    const mockColor = 'red';
    const mockHeader = 'mock header';
    const mockValue = 'mock value';
    
    it('Should create an embedded message', () => {
        const embedMsgNoParameters = new EmbeddedMessage();
        const embedMsgNoTitle = new EmbeddedMessage(mockAuthor);
        const embedMsgNoColor = new EmbeddedMessage(mockAuthor, mockTitle);
        const embedMsg = new EmbeddedMessage(mockAuthor, mockTitle, mockColor);
        
        should.not.exist(embedMsgNoParameters.title);
        should.not.exist(embedMsgNoParameters.author);        
        should.not.exist(embedMsgNoParameters.color);
        
        embedMsgNoTitle.author.should.equal(mockAuthor);
        should.not.exist(embedMsgNoTitle.title);
        should.not.exist(embedMsgNoTitle.color);
        
        embedMsgNoColor.author.should.equal(mockAuthor);
        embedMsgNoColor.title.should.equal(mockTitle);
        should.not.exist(embedMsgNoColor.color);
        
        embedMsg.title.should.equal(mockTitle);
        embedMsg.author.should.equal(mockAuthor);
        embedMsg.color.should.equal(mockColor);
    });
    
    it('Should add lines', () => {
        const embedMsg = new EmbeddedMessage(mockAuthor, mockTitle, mockColor);
        
        embedMsg.lines.should.be.empty;
        
        embedMsg.addLine(mockHeader, mockValue);
        embedMsg.addLine(mockHeader, mockValue);
        
        embedMsg.lines.length.should.equal(2);
        
        embedMsg.lines.forEach(l => {
            l.header.should.equal(mockHeader);
            l.value.should.equal(mockValue);
        });
    });
});