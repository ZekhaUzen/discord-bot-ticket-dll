const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratingadmin')
        .setDescription('Berikan rating dari 1 sampai 5 untuk admin')
        .addUserOption(option =>
            option.setName('admin')
                .setDescription('Tag admin')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('nilai')
                .setDescription('Pilih rating dari 1 hingga 5')
                .setRequired(true)
                .addChoices(
                    { name: '⭐ 1 Bintang', value: 1 },
                    { name: '⭐⭐ 2 Bintang', value: 2 },
                    { name: '⭐⭐⭐ 3 Bintang', value: 3 },
                    { name: '⭐⭐⭐⭐ 4 Bintang', value: 4 },
                    { name: '⭐⭐⭐⭐⭐ 5 Bintang', value: 5 }
                )
        )
        .addStringOption(option =>
            option.setName('komentar')
                .setDescription('Komentar tentang Admin')
                .setRequired(true)
        ),

    async execute(interaction) {
        const admin = interaction.options.getUser('admin');
        const rating = interaction.options.getInteger('nilai');
        const komentar = interaction.options.getString('komentar');
        const pemberiRating = interaction.user.username; // Nama pemberi rating

        const ratingStars = '⭐'.repeat(rating);

        // Membuat embed untuk rating yang diberikan
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Rating Admin')
            .setDescription(
                `***Nama Pemberi Rating***\n` +
                `***${pemberiRating}***\n\n` +
                `***Nama Admin***\n` +
                `***${admin}***\n\n` +
                `***Rating***\n` +
                `***${ratingStars} (${rating})***\n\n` +
                `***Komentar Warga***\n` +
                `***${komentar}***`
            );

        // Mengirimkan embed ke channel yang digunakan untuk perintah
        await interaction.reply({ embeds: [embed] });
    }
};
