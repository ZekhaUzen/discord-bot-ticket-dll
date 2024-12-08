require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const config = require('./config.json');
const ticket = require('./commands/ticket'); // Path disesuaikan dengan lokasi file ticket.js

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

// Load command data dari folder commands
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON()); // Tambahkan ke daftar untuk registrasi
}

// Refresh slash commands
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Memulai registrasi ulang slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log('Slash commands berhasil direfresh!');
    } catch (error) {
        console.error('Terjadi kesalahan saat merefresh commands:', error);
    }
})();

// Event handling
client.on('ready', () => {
    console.log(`Bot telah online sebagai ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply('Terjadi kesalahan saat menjalankan perintah!');
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'open_ticket') {
            await interaction.deferUpdate(); // Menunda update, agar interaksi tidak kedaluwarsa
            await ticket.createTicket(interaction); // Proses pembuatan tiket
        } else if (interaction.customId === 'close_ticket') {
            await interaction.deferUpdate(); // Menunda update
            await ticket.closeTicket(interaction); // Proses penutupan tiket
        }

        // Menangani button interactions untuk semua command
        for (const command of client.commands.values()) {
            if (command.handleButtonInteraction) {
                try {
                    await command.handleButtonInteraction(interaction);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    } else if (interaction.isModalSubmit()) {
        // Tangani interaksi modal
        for (const command of client.commands.values()) {
            if (command.handleModalSubmit) {
                try {
                    await command.handleModalSubmit(interaction);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
});

// Login bot
client.login(config.token);
