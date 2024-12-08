const {
    Collection,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    ChannelType,
    Client,
    ChatInputCommandInteraction,
    Message,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    AutocompleteInteraction
} = require("discord.js");

const logger = require("./logger");

const commands = new Collection();

// Layout for choices in command options
const choicesLayout = {
    /** @type {string} */
    name: null,
    /** @type {string} */
    value: null
};

// Layout for command options
const optionsLayout = {
    /** @type {ApplicationCommandOptionType} */
    type: null,
    /** @type {string} */
    name: null,
    /** @type {string} */
    description: null,
    /** @type {boolean} */
    required: false,
    /** @type {choicesLayout[]} */
    choices: [],
    /** @type {ChannelType[]} */
    channelTypes: [],
    /** @type {boolean} */
    autocomplete: false,
    /**@type {optionsLayout[]} */
    options: []
};

// Layout for commands
const commandLayout = {
    /** @type {boolean} */
    enabled: true,
    /** @type {string} */
    category: null,
    /** @type {string} */
    name: null,
    /** @type {string} */
    description: null,
    /** @type {optionsLayout[]} */
    options: [],
    /** @type {ApplicationCommandType} */
    type: ApplicationCommandType.ChatInput,
    /** @type {string[]} */
    aliases: [],
    /** @type {boolean} */
    devOnly: false,
    /** @type {boolean} */
    adminOnly: false,
    /** @type {string[]} */
    allowedRoles: [],
    /** @type {string[]} */
    allowedChannels: [],

    /**
     * To run a slash command.
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    runSlash: async (client, interaction) => { },

    /**
     * To run a slash command.
     * @param {Client} client 
     * @param {AutocompleteInteraction} interaction 
     */
    runAutocomplete: async (client, interaction) => { },

    /**
     * To run a message context menu command.
     * @param {Client} client 
     * @param {MessageContextMenuCommandInteraction} interaction 
     */
    runContextMessage: async (client, interaction) => { },

    /**
     * To run a user context menu command.
     * @param {Client} client 
     * @param {UserContextMenuCommandInteraction} interaction 
     */
    runContextUser: async (client, interaction) => { },

    /**
     * To run a legacy prefix command.
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array} args 
     */
    runLegacy: async (client, message, args) => { }
};

class Command {
    /**
     * Constructs a new command object.
     * @param {commandLayout} commandOptions - The options for configuring the command.
     */
    constructor(commandOptions) {
        const {
            name,
            category,
            enabled = true,
            description = null,
            type = ApplicationCommandType.ChatInput,
            aliases = [],
            devOnly = false,
            adminOnly = false,
            allowedRoles = [],
            allowedChannels = [],
            options = [],
            runSlash,
            runAutocomplete,
            runLegacy,
            runContextMessage,
            runContextUser
        } = commandOptions;

        if (!name) return logger.error("Missing command name.");
        if (commands.has(name)) return logger.error(`Duplicate command name: ${name}`);

        if (!category) return logger.error(`Missing command category for ${name}`);
        if (type === ApplicationCommandType.ChatInput && !description) {
            return logger.error(`Missing description for chat input command: ${name}`);
        }

        this.name = name;
        this.category = category;
        this.enabled = enabled;
        this.description = description;
        this.type = type;
        this.aliases = aliases;
        this.devOnly = devOnly;
        this.adminOnly = adminOnly;
        this.allowedRoles = allowedRoles;
        this.allowedChannels = allowedChannels;

        // Ensure run functions are provided for the appropriate command type
        this.runSlash = (type === ApplicationCommandType.ChatInput) ? runSlash : null;
        this.runLegacy = (type === ApplicationCommandType.ChatInput) ? runLegacy : null;

        this.runContextMessage = (type === ApplicationCommandType.Message) ? runContextMessage : null;
        this.runContextUser = (type === ApplicationCommandType.User) ? runContextUser : null;

        if (type === ApplicationCommandType.ChatInput && (!this.runSlash && !this.runLegacy)) {
            return logger.error(`Missing run function for chat input command: ${name}`);
        }

        if (type === ApplicationCommandType.Message && !this.runContextMessage) {
            return logger.error(`Missing run function for message context command: ${name}`);
        }

        if (type === ApplicationCommandType.User && !this.runContextUser) {
            return logger.error(`Missing run function for user context command: ${name}`);
        }

        // Configure command options
        this.options = options.map(option => ({
            type: option.type || ApplicationCommandOptionType.String,
            name: option.name,
            description: option.description,
            required: option.required || false,
            choices: option.choices || [],
            channelTypes: option.channelTypes || [],
            autocomplete: option.autocomplete || false,
            options: option.options || []
        }));

        // Add the command to the collection
        commands.set(this.name, this);
    }

    /**
     * 
     * @returns {Collection<string, commandLayout>}
     */

    static getCommands = () => commands.toJSON();
}

module.exports = Command;