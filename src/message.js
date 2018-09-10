"use strict";

class EmbededMessage {
    constructor(author, title, description, color) 
    {
        this.author = author;
        this.title = title;
        this.description = description;
        this.color = color;
        this.lines = [];
        this.thumbnail = null;
    }
    
    addLine(header, value) {
        this.lines.push({ header: header, value: value });
    }
    
    addThumbnail(path) {
        this.thumbnail = path;
    }
}

export default EmbededMessage;