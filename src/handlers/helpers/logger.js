const kleur = require('kleur');

const logger = {
    error(...args) {
        const prefix = kleur.bold(kleur.red("[ERROR] =>"))
        console.error(prefix, ...args);
    },
    info(...args) {
        const prefix = kleur.bold(kleur.green("[INFO ] =>"))
        console.info(prefix, ...args);
    },
    warn(...args) {
        const prefix = kleur.bold(kleur.yellow("[WARN ] =>"))
        console.error(prefix, ...args);
    },
    debug(...args) {
        const prefix = kleur.bold(kleur.magenta("[DEBUG] =>"))
        console.error(prefix, ...args);
    }
}

module.exports = logger;