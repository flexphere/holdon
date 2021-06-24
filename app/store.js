const fs = require('fs');

class ObjectStore {
    constructor(file, defaults={}){
        this.file = file;
        this.data = defaults;
        this.load();
    }
    
    set(key, value) {
        this.data[key] = value;
        this.save()
        return this.data[key];
    }

    get(key) {
        return key in this.data ? this.data[key] : null;
    }

    load() {
        try {
            const rawdata = fs.readFileSync(this.file, {encoding:'utf-8'});
            this.data = JSON.parse(rawdata);
        } catch(error) {
            console.log(error);
        }
        return this.data;
    }
 
    save() {
        const jsondata = JSON.stringify(this.data);
        fs.writeFileSync(this.file, jsondata);
    }
}
exports.ObjectStore = ObjectStore;

class ArrayStore {
    constructor(file, maxLength=5){
        this.file = file;
        this.data = [];
        this.maxLength = maxLength;
        this.load();
    }

    push(data) {
        this.data = [data, ...this.data.filter(v => v.data != data.data)];
        this.save()
        return this.data;
    }
    
    delete(data) {
        this.data = [...this.data.filter(v => v.data != data.data)]
        this.save()
        return this.data;
    }

    clear() {
        this.data = [];
        this.save();
        return this.data;
    }

    load() {
        try {
            const rawdata = fs.readFileSync(this.file, {encoding:'utf-8'});
            this.data = JSON.parse(rawdata);
        } catch(error) {
            console.log(error);
        }
        return this.data;
    }
 
    save() {
        const jsondata = JSON.stringify(this.data.slice(0, this.maxLength));
        fs.writeFileSync(this.file, jsondata);
    }
}

exports.ArrayStore = ArrayStore;