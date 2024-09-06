const { Client, Message, PermissionFlagsBits } = require("discord.js");
const { commandCollection, Command } = require("../../handlers/helpers/command");
const { prefixes, devs } = require("../../config");
const { findChannel, findRole } = require("../../handlers/utils");
const logger = require("../../handlers/helpers/logger");

/**
 * 
 * @param {Command} command
 * @param {Message} message
 */

async function performChecks(command, message) {
    if (!command.enabled) {
        message.reply({
            content: "This command is disabled.",
            ephemeral: true
        });

        return false;
    };

    if (command.devOnly) {
        if (!devs.includes(message.author.id)) {
            message.reply({
                content: "This command is only for developers.",
                ephemeral: true
            });

            return false;
        }
    };

    if (command.adminOnly) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator) || !devs.includes(message.author.id)) {
            message.reply({
                content: "This command is only for administrators.",
                ephemeral: true
            });

            return false;
        }
    }

    if (command.allowedChannels.length > 0) {
        for (const channel of command.allowedChannels) {
            const _channel = findChannel(channel, message.guild);
            if (_channel.id == message.channelId) {
                return true;
            }
        }

        message.reply({
            content: "You are not allowed to use this command in this channel.",
            ephemeral: true
        });

        return false;
    }

    if (command.allowedRoles.length > 0) {
        for (const role of command.allowedRoles) {
            const _role = findRole(role, message.guild);
            if (message.member.roles.cache.has(_role.id)) {
                return true;
            }
        }

        message.reply({
            content: "You are not allowed to use this command.",
            ephemeral: true
        });

        return false;
    }

    return true;
}

module.exports = {
    /**
     * @param {Client} client 
     * @param {Message} message 
     */

    run: async (client, message) => {
        if (message.author.bot || !message.guild) return;

        const prefix = prefixes.find((prefix) => message.content.startsWith(prefix));
        if (!prefix) return;

        const commandUsed = message.content.slice(prefix.length).split(/ +/).shift().toLowerCase();
        /*** @type {Command}*/
        const command = commandCollection.get(commandUsed) || commandCollection.find( /** @param {Command} cmd */ cmd => cmd.aliases.length > 0 && cmd.aliases.includes(commandUsed));
        if (!command || !command.runLegacy) return;

        await performChecks(command, message).then(() => {
            const args = message.content.slice(prefix.length + commandUsed.length).trim().split(/ +/g) || [];
            command.runLegacy(client, message, args);
        }).catch(error => logger.error(error));
    }
}