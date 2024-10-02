const { getRandomMember, isTimeAllowed } = require('./timeUtils'); 

function sendRandomMessage(channel) {
    if (!isTimeAllowed()) {
        console.log("Fora do horário permitido. Mensagem não enviada.");
        return;  // Não envia se estiver fora do horário permitido
    }

    const randomMessages = [
        "Bora criar algo incrível @user?",
        "Não existe problema sem solução, só falta de café...",
        "Dizem que sou bom de design, mas espere até ver meu lado dançarino… Pixel moves!",
        "@user, você por aqui?",
        "Acho que o @user tá bugado... 🤔",
        "@user, o que vamos projetar hoje?",
        "Tô precisando de uma ideia maluca... Quem tem uma aí?",
        "Me conta tudo @user!",
        "Fala comigo @user!",
        "Cheguei!",
        "Opa, o que rola?",
        "Me chamou? Calma, tô aqui!"
    ];

    const randomIndex = Math.floor(Math.random() * randomMessages.length);
    const message = randomMessages[randomIndex];
    const member = getRandomMember(channel.guild);

    if (member) {
        const formattedMessage = message.replace(/@user/g, `<@${member.id}>`);
        channel.send(formattedMessage)
            .then(sentMessage => {
                console.log(`Mensagem enviada: ${formattedMessage}`);
            })
            .catch(error => {
                console.error("Erro ao enviar mensagem:", error);
            });
    } else {
        console.log("Nenhum membro aleatório encontrado.");
    }
}

function sendWeekendMessage(channel) {
    // Função simples para enviar uma mensagem de fim de semana
    const weekendMessages = [
        "Até os mestres do design, como eu, merecem uma pausa. Heheee 😎",
        "Desconecta um pouco!",
        "Aqui, os pixels dançam conforme a sua criatividade manda!",
        "Hojê é dia de relaxar e recarregar as energias!",
        "Onde tem festa hoje? 😎",
        "Se precisa de uma pausa, relaxa, eu seguro os pixels por aqui!",
        "Qual o plano de hoje?"

    ];

    const randomIndex = Math.floor(Math.random() * weekendMessages.length);
    const message = weekendMessages[randomIndex];

    channel.send(message).then(() => {
        console.log(`Mensagem de fim de semana enviada: ${message}`);
    }).catch(error => {
        console.error("Erro ao enviar mensagem de fim de semana:", error);
    });
}

function getRandomReply() {
    const randomReplies = [
        "Haha, boa!",
        "Concordo com você!",
        "Interessante 🤔",
        "Nem me fale!",
        "É isso aí!",
        "Você tem razão!",
        "Pode crer!",
        "Kkkk, verdade!",
        "Também acho!",
        "Que legal!",
        "Hum, acho que isso não vai rolar.",
        "A culpa é do @user",
        "Foi o @user que fez isso!",
        "Não sei, o @user deve saber.",
        "Sem erro!",
        "É pra já!"


    ];

    const randomIndex = Math.floor(Math.random() * randomReplies.length);
    return randomReplies[randomIndex];
}

module.exports = { sendRandomMessage, sendWeekendMessage, getRandomReply };
