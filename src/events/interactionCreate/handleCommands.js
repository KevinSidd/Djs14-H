const { Client, PermissionFlagsBits, ChatInputCommandInteraction } = require("discord.js");
const { getCommands } = require("../../handlers/helpers/command");
const { devs } = require("../../config");
const logger = require("../../handlers/helpers/logger");
const Utils = require("../../handlers/utils");

/**
 * Perform checks on a command to ensure it can be executed.
 * @param {Command} command - The command object.
 * @param {ChatInputCommandInteraction | ContextMenuCommandInteraction} interaction - The interaction object from Discord.
 * @returns {Promise<boolean>} - Whether the command passes all checks.
 */
async function performChecks(command, interaction) {
    // Check if command is enabled
    if (!command.enabled) {
        await interaction.reply({ content: "This command is disabled.", ephemeral: true });
        return false;
    }

    // Check if command is developer-only and whether the user is a dev
    if (command.devOnly && !devs.includes(interaction.user.id)) {
        await interaction.reply({ content: "This command is only for developers.", ephemeral: true });
        return false;
    }

    // Check if command is admin-only and whether the user has admin permissions or is a dev
    if (command.adminOnly && !interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !devs.includes(interaction.user.id)) {
        await interaction.reply({ content: "This command is only for administrators.", ephemeral: true });
        return false;
    }

    // Check if the command is restricted to specific channels
    if (command.allowedChannels.length > 0) {
        const isAllowedChannel = command.allowedChannels.some(channelId => {
            const channel = Utils.findChannel(channelId, interaction.guild);
            return channel && channel.id === interaction.channelId;
        });

        if (!isAllowedChannel) {
            await interaction.reply({
                content: `This command can only be used in the following channels: ${command.allowedChannels.join(", ")}`,
                ephemeral: true
            });
            return false;
        }
    }

    // Check if the command is restricted to specific roles
    if (command.allowedRoles.length > 0) {
        const hasAllowedRole = command.allowedRoles.some(roleId => {
            const role = Utils.findRole(roleId, interaction.guild);
            return role && interaction.member.roles.cache.has(role.id);
        });

        if (!hasAllowedRole) {
            await interaction.reply({
                content: `This command can only be used by the following roles: ${command.allowedRoles.join(", ")}`,
                ephemeral: true
            });
            return false;
        }
    }

    return true;
}

module.exports = {
    /**
     * Handle incoming interactions and execute appropriate commands.
     * @param {Client} client - The Discord client instance.
     * @param {ChatInputCommandInteraction} interaction - The interaction object.
     */
    run: async (client, interaction) => {
        if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) return;

        const commandCollection = getCommands();
        const command = commandCollection.find(c => c.name === interaction.commandName);

        // Ensure command exists and has appropriate handler
        if (!command) {
            return interaction.reply({ content: "The command does not exist or was not updated.", ephemeral: true });
        }

        // Determine the interaction type and run the associated command
        const isSlashCommand = interaction.isChatInputCommand() && command.runSlash;
        const isUserContextCommand = interaction.isUserContextMenuCommand() && command.runContextUser;
        const isMessageContextCommand = interaction.isMessageContextMenuCommand() && command.runContextMessage;
        const isAutoCompleteCommand = interaction.isAutocomplete() && command.runAutocomplete;
        
        if (isSlashCommand || isUserContextCommand || isMessageContextCommand) {
            try {
                const checksPassed = await performChecks(command, interaction);
                if (!checksPassed) return;

                if (isSlashCommand) {
                    command.runSlash(client, interaction);
                } else if (isUserContextCommand) {
                    command.runContextUser(client, interaction);
                } else if (isMessageContextCommand) {
                    command.runContextMessage(client, interaction);
                } else if(isAutoCompleteCommand) {
                    command.runAutocomplete(client, interaction);
                }
            } catch (error) {
                logger.error(error);
            }
        } else {
            interaction.reply({ content: "The command does not exist or was not updated.", ephemeral: true });
        }
    }
}