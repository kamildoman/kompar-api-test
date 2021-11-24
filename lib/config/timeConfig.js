// @ts-check

'use strict';

function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

module.exports = {
    toCorrectZone(milis) {
        const date = new Date(milis);
        const timezone = Math.abs(date.getTimezoneOffset()/60);
        return milis + (1000 * 60 * 60 * timezone); // one or two hours
    },
    dateToTextShort(ms) {
        const nowDate = new Date(ms);
        const dd = String(nowDate.getUTCDate()).padStart(2, '0');
        const mm = String(nowDate.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = nowDate.getUTCFullYear();
        return `${dd}.${mm}.${yyyy}`;
    },
    dateToTextLong(ms) {
        const nowDate = new Date(ms);
        const dateToTextShort = this.dateToTextShort(nowDate.getTime());
        const h = nowDate.getUTCHours();
        const m = nowDate.getUTCMinutes();
        const s = nowDate.getUTCSeconds();
        return `${dateToTextShort} - ${h}:${checkTime(m)}:${checkTime(s)}`;
    }
}