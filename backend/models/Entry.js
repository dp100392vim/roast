const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    type: String, // espresso , filter
    weight: Number, // batch weight gramm
    weather: Number, // temperature today
    batch: Number, // batch number
    name: String, // coffee name
    roast: String, // roast light, medium, dark
    start: {
        exhaust: Number, // exhaust temperature number with one decimal place
        environment: Number, // environment temperature number with one decimal place
        gas: Number, // gas power lvl in 0.5 increments 
        hz: Number // drum hz 5 increments (30-60)
    },
    middle: {
        time: Number, // time from HH:MM:SS 
        exhaust: Number,
        beans: Number, // beans temperature number with one decimal place
        environment: Number,
        gas: Number,
        min: Boolean, // gas min (special value below 0.5)
        off: Boolean, // gas off (with pilot fire on)
        f_off: Boolean, // gas off (with pilot fire off) 
        hz: Number
    },
    crack: {
        time: Number,
        exhaust: Number,
        beans: Number,
        environment: Number,
        gas: Number,
        min: Boolean,
        off: Boolean,
        f_off: Boolean,
        hz: Number
    },
    end: {
        time: Number,
        exhaust: Number,
        beans: Number,
        environment: Number,
        gas: Number,
        min: Boolean,
        off: Boolean,
        f_off: Boolean,
        hz: Number
    }
});

module.exports = mongoose.model('Entry', entrySchema);