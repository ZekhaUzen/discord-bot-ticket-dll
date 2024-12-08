const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle, ChannelType } = require('discord.js');
const config = require('../config.json'); // Pastikan path config benar
const ticketCategoryId = config.ticketCategoryId; // ID kategori tiket

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Membuka tiket untuk dukungan'),

    async execute(interaction) {
        // Membuat button untuk membuka tiket
        const button = new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('Buat Tiket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        // Membuat embed untuk instruksi
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Membuka Tiket')
            .setDescription('Klik tombol di bawah ini untuk membuka tiket.');

        // Mengirim embed dan tombol
        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async createTicket(interaction) {
        const guild = interaction.guild;

        // Membuat channel tiket
        const ticketChannel = await guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: ticketCategoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel'],
                },
            ],
        });

        // Membuat embed untuk tiket
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Tiket Baru Dibuka')
            .setImage(config.ICON_URL)
            .setDescription(`Halo ${interaction.user}, terima kasih telah membuka tiket! Silakan tunggu staff kami untuk membantu Anda.`)
            .setFooter({ text: 'Tim Support' });

        // Kirim pesan di channel tiket
        await ticketChannel.send({ embeds: [embed] });

        // Menambahkan tombol untuk menutup tiket
        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Tutup Tiket')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({ content: 'Klik tombol di bawah ini untuk menutup tiket.', components: [row] });

        await interaction.reply({ content: `Tiket Anda telah dibuka: ${ticketChannel}`, ephemeral: true });
    },

    async closeTicket(interaction) {
        const ticketChannel = interaction.channel;
        // Menghapus channel tiket
        await interaction.reply({ content: 'Tiket akan segera ditutup.', ephemeral: true });
        setTimeout(() => ticketChannel.delete(), 5000); // Menunggu 5 detik sebelum menghapus channel
    }
};
