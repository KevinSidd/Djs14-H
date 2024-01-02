const { REST, Routes, Client } = require("discord.js");
const { getCommands } = require("../../../modules/utils");
const logger = require("../../../modules/logger");
const config = require("../../../../config");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/**
 * @param {Client} client 
 */

module.exports = async (/**@type {Client} */ client) => {
    try {
        const commands = getCommands().map((c) => {
            return {
                name: c.name,
                description: c.description,
                options: c.options,
            };
        });

        logger.system(`MultiGuild is registration ${config.MultiGuild ? "enabled" : "disabled"}`);;

        const data = await rest.put(
            config.MultiGuild ? Routes.applicationCommands(client.user.id) : Routes.applicationGuildCommands(client.user.id, config.serverID),
            { body: commands }
        );

        if (config.extraStartUpLogs) {
            commands.forEach((c) => {
                logger.update(`Registered: ${c.name}`);
            })
        }

        logger.system("Registered " + data.length + " commands.");
    } catch (e) {
        console.error(e);
    }
}