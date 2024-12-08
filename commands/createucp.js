const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const mysql = require('mysql2/promise');
require('dotenv').config();
const cf = require('../config.json');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createucp')
        .setDescription('Membuat User Control Panel (UCP) dengan username pilihan Anda.'),

    async execute(interaction) {
        const allowedRoleId = cf.allowedRole;  // Ganti dengan ID role yang diizinkan
        const member = await interaction.guild.members.fetch(interaction.user.id);

        // Cek apakah pengguna memiliki role yang sesuai
        if (!member.roles.cache.has(allowedRoleId)) {
            return interaction.reply({
                content: 'Anda tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Buat UCP')
            .setImage(cf.ICON_URL)
            .setDescription('Klik tombol di bawah untuk membuat User Control Panel (UCP).')
            .setFooter({ text: 'User Control Panel System' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ucp_button')
                    .setLabel('Buat UCP')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};

module.exports.handleButtonInteraction = async (interaction) => {
    if (interaction.customId === 'create_ucp_button') {
        const modal = new ModalBuilder()
            .setCustomId('create_ucp_modal')
            .setTitle('Buat UCP Baru');

        const usernameInput = new TextInputBuilder()
            .setCustomId('ucp_username')
            .setLabel('Masukkan Username')
            .setPlaceholder('Contoh: User123')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(usernameInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};

module.exports.handleModalSubmit = async (interaction) => {
    if (interaction.customId === 'create_ucp_modal') {
        const username = interaction.fields.getTextInputValue('ucp_username');
        const discordId = interaction.user.id;

        try {
            const connection = await mysql.createConnection(dbConfig);
            const [existingDiscord] = await connection.execute(
                'SELECT * FROM playerucp WHERE DiscordID = ?',
                [discordId]
            );
            if (existingDiscord.length > 0) {
                await connection.end();
                return interaction.reply({
                    content: 'Anda sudah mendaftarkan UCP sebelumnya.',
                    ephemeral: true,
                });
            }

            const [existingUCP] = await connection.execute(
                'SELECT * FROM playerucp WHERE ucp = ?',
                [username]
            );
            if (existingUCP.length > 0) {
                await connection.end();
                return interaction.reply({
                    content: 'Username/UCP sudah terdaftar, silakan gunakan username lain.',
                    ephemeral: true,
                });
            }

            const verifyCode = Math.floor(100000 + Math.random() * 900000);
            const [result] = await connection.execute(
                'INSERT INTO playerucp (ucp, password, salt, verifycode, DiscordID) VALUES (?, ?, ?, ?, ?)',
                [username, '', '', verifyCode, discordId]
            );
            await connection.end();

            await interaction.user.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setImage(cf.ICON_URL)
                        .setTitle('UCP Berhasil Dibuat!')
                        .setDescription(`Halo ${interaction.user.username},\n\nUCP Anda telah berhasil dibuat!`)
                        .addFields(
                            { name: 'Verify Code', value: `${verifyCode}`, inline: true },
                            { name: 'Username', value: username, inline: true }
                        )
                        .setFooter({ text: 'User Control Panel System' })
                ]
            });

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('UCP Berhasil Dibuat')
                .addFields(
                    { name: 'Username', value: username, inline: true }
                )
                .setFooter({ text: 'User Control Panel System' });

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // Mengubah nickname pengguna
            const member = await interaction.guild.members.fetch(discordId);
            // Pastikan bot memiliki izin 'MANAGE_NICKNAMES'
            if (interaction.guild.me.permissions.has('MANAGE_NICKNAMES')) {
                const newNickname = `Warga: ${username}`;
                try {
                    await member.setNickname(newNickname);
                    await interaction.reply({
                        content: `Nickname Anda telah berhasil diubah menjadi **${newNickname}**.`,
                        ephemeral: true,
                    });
                } catch (error) {
                    console.error('Gagal mengubah nickname:', error);
                    await interaction.followUp({
                        content: 'Berhasil membuat UCP, namun gagal mengubah nickname.',
                        ephemeral: true,
                    });
                }
            } else {
                await interaction.reply({
                    content: 'Bot tidak memiliki izin untuk mengubah nickname.',
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Terjadi kesalahan saat membuat UCP.',
                ephemeral: true,
            });
        }
    }
};
