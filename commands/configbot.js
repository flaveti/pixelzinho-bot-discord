const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendRandomMessage } = require('../utils/randomMessage'); // Importe a função
const { isTimeAllowed } = require('../utils/timeUtils');

let interactionChannelId = null;
let logsChannelId = null;
let mentionFrequency = 5; // Frequência padrão
let likeEmojis = []; // Lista de emojis para curtidas

function getMainMenuContent() {
    const description = `\`\`\`🎛️ Configuração do Pixelzinho\`\`\`\n` +
        `O Pixelzinho é um bot personalizável que permite configurar diversos parâmetros de interação, desde menções até respostas automáticas, tudo para garantir uma experiência dinâmica e personalizada para o seu servidor.\n` +
        `\n` +
        `❗ **Para que o bot funcione corretamente, o primeiro menu que você deve configurar é o de "Canais"**. Aqui você definirá os canais nos quais o bot poderá interagir e enviar notificações, garantindo que ele esteja ativo nos locais corretos do servidor.\n` +
        `\n` +
        `## **O que deseja configurar?**\n` +
        `\n` +
        `Escolha uma das opções abaixo para ajustar os parâmetros do bot de acordo com suas preferências.\n` +
        `\n` +
        `𝄃𝄃𝄂𝄂𝄀𝄁𝄃𝄂𝄂𝄃 Flávia Machado ® *Pliss Studio 2024*`;

    const embed = new EmbedBuilder()
        .setColor('#9B59B6') // Cor roxa
        .setDescription(description);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('config_canais')
                .setLabel('Canais')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('config_mencoes')
                .setLabel('Menções')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('config_curtidas')
                .setLabel('Curtidas')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('config_sair')
                .setLabel('Sair')
                .setStyle(ButtonStyle.Danger)
        );

    return { embeds: [embed], components: [row] };
}

function handleConfigCommand(interaction) {
    const member = interaction.member || interaction.guild.members.cache.get(interaction.user.id);

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== interaction.guild.ownerId) {
        interaction.reply({ content: '📛 **Você não tem permissão para configurar o bot.**', ephemeral: true });
        return;
    }

    const { embeds, components } = getMainMenuContent();

    if (interaction.replied || interaction.deferred) {
        interaction.followUp({ embeds, components });
    } else if (interaction.isButton && interaction.isButton()) {
        interaction.update({ embeds, components });
    } else {
        interaction.reply({ embeds, components });
    }
}

async function handleButtonInteraction(interaction, client) {
    const member = interaction.member || interaction.guild.members.cache.get(interaction.user.id);

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== interaction.guild.ownerId) {
        await interaction.reply({ content: 'Você não tem permissão para configurar o bot.', ephemeral: true });
        return;
    }

    if (interaction.customId === 'config_canais') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('canais_logs')
                    .setLabel('Logs')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('canais_interacoes')
                    .setLabel('Interações')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('canais_voltar')
                    .setLabel('Voltar')
                    .setStyle(ButtonStyle.Secondary)
            );

        const description = `\`\`\`📢 Configuração de Canais\`\`\`\n` +
            `Defina os canais que o bot utilizará para enviar mensagens e registrar atividades.\n` +
            `\n` +
            `⤷ **Logs:** Escolha o canal para receber registros sobre o funcionamento do bot.\n` +
            `⤷ **Interações:** Escolha o canal por onde o bot enviará mensagens de interação.\n` +
            `\n` +
            `**Como pegar o ID do canal:** Clique com o botão direito no canal desejado e selecione "Copiar ID". Certifique-se de que o modo de desenvolvedor está ativado nas configurações do Discord.`;

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription(description);

        await interaction.update({
            embeds: [embed],
            components: [row]
        });

    } else if (interaction.customId === 'canais_interacoes') {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription('Envie o ID do Canal para que o bot envie mensagens de Interação por ele');

        await interaction.update({
            embeds: [embed],
            components: []
        });
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async m => {
            interactionChannelId = m.content.trim();
            console.log(`ID do Canal de Interações: ${interactionChannelId}`);

            const embedConfirmation = new EmbedBuilder()
                .setColor('#9B59B6')
                .setDescription(`ID do Canal de Interações salvo: ${interactionChannelId}\n ✔ Configuração concluída. Retornando ao menu de configuração dos canais...`);

            await interaction.followUp({
                embeds: [embedConfirmation],
                components: []
            });
            sendLogMessage(client, `💬 **ID do Canal de Interações:** ${interactionChannelId}`);
            await showChannelConfigMenu(interaction);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp('Tempo esgotado. Por favor, tente novamente.');
            }
        });
    } else if (interaction.customId === 'canais_logs') {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription('Envie o ID do Canal para que o bot envie registros de logs por ele');

        await interaction.update({
            embeds: [embed],
            components: []
        });
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async m => {
            logsChannelId = m.content.trim();
            console.log(`ID do Canal de Logs: ${logsChannelId}`);

            const embedConfirmation = new EmbedBuilder()
                .setColor('#9B59B6')
                .setDescription(`ID do Canal de Logs salvo: ${logsChannelId}\n ✔ Configuração concluída. Retornando ao menu de configuração dos canais...`);

            await interaction.followUp({
                embeds: [embedConfirmation],
                components: []
            });
            sendLogMessage(client, `🛠️ **ID do Canal de Logs:** ${logsChannelId}`);
            await showChannelConfigMenu(interaction);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp('Tempo esgotado. Por favor, tente novamente.');
            }
        });
    } else if (interaction.customId === 'canais_voltar' || interaction.customId === 'mencoes_voltar' || interaction.customId === 'curtidas_voltar') {
        const { embeds: mainEmbeds, components: mainComponents } = getMainMenuContent();
        await interaction.update({ embeds: mainEmbeds, components: mainComponents });

    } else if (interaction.customId === 'config_mencoes') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mencoes_baixa')
                    .setLabel('Baixa (3x)')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mencoes_moderada')
                    .setLabel('Moderada (5x)')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mencoes_alta')
                    .setLabel('Alta (10x)')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mencoes_louca')
                    .setLabel('Louca! (20x)')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mencoes_voltar')
                    .setLabel('Voltar')
                    .setStyle(ButtonStyle.Secondary)
            );

        const description = `\`\`\`💬 Configuração de Menções\`\`\`\n` +
            `Defina a frequência com que o bot enviará mensagens de menção ao longo do dia.\n` +
            `\n` +
            `Escolha uma das opções abaixo para ajustar a frequência conforme sua preferência:\n` +
            `\n` +
            `⤷ **Baixa (3x):** O bot enviará 3 menções por dia.\n` +
            `⤷ **Moderada (5x):** O bot enviará 5 menções por dia.\n` +
            `⤷ **Alta (10x):** O bot enviará 10 menções por dia.\n` +
            `⤷ **Louca! (20x):** O bot enviará 20 menções por dia.\n` +
            `\n` +
            `**Dica:** Escolha a frequência que melhor se adapta ao seu servidor.`;

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription(description);

        await interaction.update({
            embeds: [embed],
            components: [row]
        });

    } else if (interaction.customId.startsWith('mencoes_')) {
        let frequency;
        switch (interaction.customId) {
            case 'mencoes_baixa':
                frequency = 3;
                break;
            case 'mencoes_moderada':
                frequency = 5;
                break;
            case 'mencoes_alta':
                frequency = 10;
                break;
            case 'mencoes_louca':
                frequency = 20;
                break;
        }
        setMentionFrequency(frequency);

        const embedConfirmation = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription(`✔ Frequência de menções definida para ${getFrequencyLabel(frequency)}.`);

        await interaction.update({
            embeds: [embedConfirmation],
            components: []
        });
        const scheduledTimes = scheduleMentions(client);
        sendLogMessage(client, `📣 **Frequência de Menções:** ${getFrequencyLabel(frequency)}\n> *Horários: ${scheduledTimes.join(', ')}*`);
        handleConfigCommand(interaction);

    } else if (interaction.customId === 'config_curtidas') {
        const description = `\`\`\`😃 Configuração de Curtidas\`\`\`\n` +
            `Personalize os emojis que o bot usará para reagir às mensagens.\n` +
            `\n` +
            `**Instruções:** Clique em **'Definir Emojis'** para escolher até 5 emojis que vão ser usados nas reações de curtidas.`;

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription(description);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('curtidas_enviar')
                    .setLabel('Definir Emojis')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('curtidas_voltar')
                    .setLabel('Voltar')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [row]
        });

    } else if (interaction.customId === 'curtidas_enviar') {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription('Por favor, envie até 5 emojis para serem usados nas reações de curtidas.');

        await interaction.update({
            embeds: [embed],
            components: []
        });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async m => {
            likeEmojis = m.content.trim().split(/\s+/).slice(0, 5);
            console.log(`Emojis de Curtidas: ${likeEmojis.join(' ')}`);

            const embedConfirmation = new EmbedBuilder()
                .setColor('#9B59B6')
                .setDescription(`Emojis de Curtidas salvos: ${likeEmojis.join(' ')}\n ✔ Configuração concluída.`);

            await interaction.followUp({
                embeds: [embedConfirmation],
                components: []
            });
            sendLogMessage(client, `😃 **Emojis de Curtidas:** ${likeEmojis.join(' ')}`);
            handleConfigCommand(interaction);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp('Tempo esgotado. Por favor, tente novamente.');
            }
        });

    } else if (interaction.customId === 'config_sair') {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription('Tchau! 👋');

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }
}

async function showChannelConfigMenu(interaction) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('canais_interacoes')
                .setLabel('Interações')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('canais_logs')
                .setLabel('Logs')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('canais_voltar')
                .setLabel('Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

    const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setDescription('Defina os canais de interação e de registro de atividades (logs)');

    await interaction.followUp({
        embeds: [embed],
        components: [row]
    });
}

function sendLogMessage(client, logMessage) {
    const guild = client.guilds.cache.first();
    const logsChannelId = getLogsChannelId();
    const logChannel = guild.channels.cache.get(logsChannelId);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setDescription(logMessage)
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    } else {
        console.log(`Canal de logs não configurado ou não encontrado. ID atual: ${logsChannelId}`);
    }
}

function setMentionFrequency(frequency) {
    mentionFrequency = frequency;
    console.log(`Frequência de menções definida para ${frequency}x por dia.`);
    // Reagendar menções com a nova frequência
}

function getMentionFrequency() {
    return mentionFrequency;
}

function getLikeEmojis() {
    return likeEmojis;
}

function getInteractionChannelId() {
    return interactionChannelId;
}

function getLogsChannelId() {
    return logsChannelId;
}

let scheduledMentionTimeouts = []; // Para rastrear os timeouts agendados

function scheduleMentions(client) {
    // Limpa qualquer timeout existente
    scheduledMentionTimeouts.forEach(timeout => clearTimeout(timeout));
    scheduledMentionTimeouts = [];

    const scheduledTimes = [];
    const frequency = getMentionFrequency(); // Obter a frequência atual

    // Definir o intervalo permitido
    const startHour = 7;
    const startMinute = 0;
    const endHour = 23;
    const endMinute = 50;

    // Calcular o horário de início e término
    let startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);
    let endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    // Se o horário atual for após o horário de término, agendar para o próximo dia
    const now = new Date();
    if (now > endTime) {
        startTime.setDate(startTime.getDate() + 1);
        endTime.setDate(endTime.getDate() + 1);
    } else if (now < startTime) {
        // Se o horário atual for antes do horário de início, ajustar o startTime para hoje
        startTime.setDate(startTime.getDate());
        endTime.setDate(endTime.getDate());
    }

    // Calcular o total de minutos no intervalo permitido
    const totalMinutes = (endTime - startTime) / (60 * 1000);

    // Calcular o intervalo entre as mensagens
    const intervalMinutes = totalMinutes / (frequency - 1); // Subtrai 1 para espaçar corretamente

    for (let i = 0; i < frequency; i++) {
        // Calcular o horário para cada mensagem
        const mentionTime = new Date(startTime.getTime() + intervalMinutes * i * 60 * 1000);
        scheduledTimes.push(mentionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        const delay = mentionTime.getTime() - now.getTime();

        if (delay <= 0) {
            continue; // Ignora horários no passado
        }

        const timeout = setTimeout(() => {
            const currentTime = new Date();
            if (!isTimeAllowed(currentTime)) {
                console.log("Fora do horário permitido. Mensagem não enviada.");
                return;
            }

            const guild = client.guilds.cache.first();
            const interactionChannelId = getInteractionChannelId();
            const channel = guild.channels.cache.get(interactionChannelId);

            if (channel) {
                sendRandomMessage(channel);
                console.log("Mensagem aleatória enviada.");
                sendLogMessage(client, "> ➤ **Mensagem aleatória enviada.**");

                // Verificar se todas as mensagens foram enviadas
                scheduledMentionTimeouts.shift(); // Remove o timeout executado
                if (scheduledMentionTimeouts.length === 0) {
                    // Agendar o próximo lote de mensagens para o próximo dia
                    scheduleNextDayMentions(client);
                }
            } else {
                console.log(`Canal de interações não configurado ou não encontrado. ID atual: ${interactionChannelId}`);
                sendLogMessage(client, `Canal de interações não configurado ou não encontrado. ID atual: ${interactionChannelId}`);
            }
        }, delay);

        scheduledMentionTimeouts.push(timeout);
    }


    return scheduledTimes;
}

function getFrequencyLabel(frequency) {
    switch(frequency) {
        case 3:
            return 'Baixa (3x por dia)';
        case 5:
            return 'Moderada (5x por dia)';
        case 10:
            return 'Alta (10x por dia)';
        case 20:
            return 'Louca! (20x por dia)';
        default:
            return `${frequency}x por dia`;
    }
}

function scheduleNextDayMentions(client) {
    // Calcula o tempo até a meia-noite
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    const timeUntilMidnight = nextMidnight - now;

    setTimeout(() => {
        scheduleMentions(client);
    }, timeUntilMidnight);
}   

function getRandomTime(startHour, endHour, endMinute) {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute, 0);

    const randomTime = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomTime;
}

module.exports = {
    handleConfigCommand,
    handleButtonInteraction,
    getInteractionChannelId,
    getLogsChannelId,
    setMentionFrequency,
    sendLogMessage,
    showChannelConfigMenu,
    scheduleMentions,
    getMentionFrequency,
    getLikeEmojis
};