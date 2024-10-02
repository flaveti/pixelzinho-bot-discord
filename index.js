const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('./config.json');  // Carrega o arquivo de configuração
const { handleConfigCommand, handleButtonInteraction, getInteractionChannelId, getLogsChannelId, sendLogMessage, scheduleMentions, getLikeEmojis } = require('./commands/configbot');
const { isTimeAllowed, getRandomMemberExcluding } = require('./utils/timeUtils');
const { sendRandomMessage, sendWeekendMessage, getRandomReply } = require('./utils/randomMessage');

// Criando o cliente do bot com as permissões necessárias
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions // Detecta reações
    ]
});

const discordBotToken = config.discordBotToken;  // Usando o token do arquivo de configuração
let reactedMessages = new Set(); // Armazena IDs das mensagens já reagidas

// Evento quando o bot está pronto
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    sendLogMessage(client, `Bot conectado como ${client.user.tag} 🤖`);
    scheduleMentions(client); // Agendar menções
    scheduleLikes();
    resetReactedMessagesDaily();
});

// Evento quando uma mensagem é enviada
client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignora mensagens de outros bots

    if (message.content === '!teste') {
        sendRandomMessage(message.channel);
        sendLogMessage(client, "> ➤ **Mensagem de teste enviada.**");
    } else if (message.content === '!configbot') {
        const member = message.member;

        if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && message.author.id !== message.guild.ownerId) {
            message.reply({ content: '📛 **Você não tem permissão para configurar o bot.**' });
            return;
        }

        handleConfigCommand(message);
    }
});

// Evento para lidar com interações de botões
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    await handleButtonInteraction(interaction, client);
});

// Evento para responder a mensagens que são respostas diretas ao bot
client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignora mensagens de bots

    // Verifica se a mensagem é uma resposta direta a uma mensagem do bot
    if (message.reference && message.reference.messageId) {
        try {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (referencedMessage.author.id === client.user.id) {
                // É uma resposta à mensagem do bot

                const replyMessageTemplate = getRandomReply();

                // Obter um membro aleatório que não seja o autor da mensagem
                const randomMember = getRandomMemberExcluding(message.guild, message.author.id);

                // Substituir @user pelo mention do membro aleatório
                let replyMessage = replyMessageTemplate;
                if (randomMember) {
                    replyMessage = replyMessageTemplate.replace(/@user/g, `<@${randomMember.id}>`);
                } else {
                    // Se não houver outro membro, remove @user ou substitui por uma mensagem padrão
                    replyMessage = replyMessageTemplate.replace(/@user/g, 'alguém');
                }

                message.reply(replyMessage)
                    .then(() => {
                        console.log(`Resposta enviada: ${replyMessage}`);
                        sendLogMessage(client, `> 💬 **Resposta enviada:** ${replyMessage}`);
                    })
                    .catch(console.error);
            }
        } catch (error) {
            console.error("Erro ao buscar a mensagem referenciada:", error);
        }
    }
});

// Função para agendar curtidas aleatórias
function scheduleLikes() {
    setInterval(async () => {
        if (!isTimeAllowed()) {
            console.log("Fora do horário permitido. Curtida não realizada.");
            return;
        }

        const guild = client.guilds.cache.first();
        const interactionChannelId = getInteractionChannelId();
        const channel = guild.channels.cache.get(interactionChannelId);

        if (channel) {
            const messages = await channel.messages.fetch({ limit: 3 });
            const messageArray = Array.from(messages.values());
            const likeEmojis = getLikeEmojis();

            // Filtra mensagens que ainda não foram reagidas
            const unreactedMessages = messageArray.filter(msg => !reactedMessages.has(msg.id));

            if (unreactedMessages.length > 0 && likeEmojis.length > 0) {
                const randomMessage = unreactedMessages[Math.floor(Math.random() * unreactedMessages.length)];
                const randomEmoji = likeEmojis[Math.floor(Math.random() * likeEmojis.length)];
                if (randomMessage && randomEmoji) {
                    await randomMessage.react(randomEmoji);
                    reactedMessages.add(randomMessage.id);
                    console.log(`Reagiu com ${randomEmoji} à mensagem: ${randomMessage.content}`);
                    sendLogMessage(client, `👍 **Reagiu com ${randomEmoji} à mensagem:** ${randomMessage.content}`);
                }
            } else {
                console.log("Nenhuma mensagem disponível para reagir ou nenhum emoji configurado.");
            }
        } else {
            console.log(`Canal de interações não configurado ou não encontrado. ID atual: ${interactionChannelId}`);
            sendLogMessage(client, `Canal de interações não configurado ou não encontrado. ID atual: ${interactionChannelId}`);
        }
    }, 90 * 60 * 1000); // A cada 1h30 minutos
}

// Função para resetar a lista de mensagens reagidas diariamente
function resetReactedMessagesDaily() {
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0); // Próxima meia-noite
    const timeUntilMidnight = nextMidnight - now;

    setTimeout(() => {
        reactedMessages.clear();
        console.log("Lista de mensagens reagidas foi resetada.");
        resetReactedMessagesDaily();
    }, timeUntilMidnight);
}

// Login no bot
client.login(discordBotToken);
