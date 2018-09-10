"use strict";

class EmbededMessage {
    constructor(author, title, color) 
    {
        this.author = author;
        this.title = title;
        this.color = color;
        this.lines = [];
    }
    
    addLine(header, value) {
        this.lines.push({ header: header, value: value });
    }
}

export default EmbededMessage;