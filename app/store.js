const fs = require('fs');

class Store {
    constructor(file, maxLength=5){
        this.file = file;
        this.data = [];
        this.maxLength = maxLength;
        this.load();
    }

    push(data) {
        this.data = [data, ...this.data.filter(v => v != data)];
        this.data = this.data.slice(0, this.maxLength);
    }

    load() {
        const rawdata = fs.readFileSync(this.file, {encoding:'utf-8'});
        this.data = JSON.parse(rawdata);
        return this.data;
    }
 
    save() {
        const jsondata = JSON.stringify(this.data);
        fs.writeFileSync(this.file, jsondata);
    }
}

exports.Store = Store;