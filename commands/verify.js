const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json');  // Mengambil verifyrole dari config.json

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Klik tombol untuk mendapatkan role verifikasi.'),

    async execute(interaction) {
        // Memeriksa apakah pengguna memiliki role yang diizinkan
        const allowedRoleId = config.allowedRole;  // Role ID yang diperbolehkan untuk menggunakan perintah /verify
        const member = interaction.guild.members.cache.get(interaction.user.id);

        if (!member) {
            return interaction.reply({ content: 'Anggota tidak ditemukan di server!', ephemeral: true });
        }

        // Cek apakah pengguna memiliki role yang sesuai
        if (!member.roles.cache.has(allowedRoleId)) {
            return interaction.reply({
                content: 'Anda tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true,
            });
        }

        // ID role dari config.json
        const roleId = config.verifyrole;
        const guild = interaction.guild;

        // Embed yang menampilkan informasi verifikasi
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Verifikasi Akun')
            .setDescription('Klik tombol di bawah ini untuk mendapatkan role verifikasi.');

        // Membuat tombol untuk verifikasi
        const verifyButton = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('Verifikasi Akun')
            .setStyle(ButtonStyle.Primary);

        // Menyiapkan ActionRow untuk menampilkan tombol
        const row = {
            type: 1,
            components: [verifyButton],
        };

        try {
            // Menampilkan embed dan tombol kepada pengguna
            await interaction.reply({
                content: 'Klik tombol di bawah ini untuk mendapatkan role verifikasi.',
                embeds: [embed],
                components: [row],
            });
        } catch (error) {
            console.error('Error saat mengirimkan verifikasi:', error);
            return interaction.reply({
                content: 'Terjadi kesalahan saat mengirimkan verifikasi. Coba lagi nanti.',
                ephemeral: true,
            });
        }

        // Mengatur interaksi tombol
        const filter = (buttonInteraction) => {
            return buttonInteraction.customId === 'verify_button' && buttonInteraction.user.id === interaction.user.id;
        };

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            // Waktu telah dihapus, jadi tombol tetap tersedia untuk klik kapan saja
        });

        collector.on('collect', async (buttonInteraction) => {
            // Defer update untuk menghindari masalah Unknown Interaction
            await buttonInteraction.deferUpdate();

            try {
                // Memberikan role kepada pengguna yang mengklik tombol
                const role = guild.roles.cache.get(roleId);

                if (!role) {
                    return buttonInteraction.followUp({
                        content: `Role dengan ID ${roleId} tidak ditemukan.`,
                        ephemeral: true,
                    });
                }

                await member.roles.add(role); // Memberikan role
                await buttonInteraction.followUp({
                    content: `Anda telah diberikan role **${role.name}**.`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error('Error saat memberikan role:', error);
                await buttonInteraction.followUp({
                    content: 'Terjadi kesalahan saat memberikan role. Coba lagi nanti.',
                    ephemeral: true,
                });
            }
        });
    },
};
