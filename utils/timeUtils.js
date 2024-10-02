function isTimeAllowed(currentTime = new Date()) {
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    // Verifica se está entre 7h00 e 23h50
    if (currentHour < 7 || (currentHour > 23) || (currentHour === 23 && currentMinutes >= 50)) {
        return false;
    }
    return true;
}

function getRandomMember(guild) {
    const members = guild.members.cache.filter(member => !member.user.bot);  // Filtro para não incluir bots
    const randomMember = members.random();  // Escolhe um membro aleatório
    return randomMember;
}

function getRandomMemberExcluding(guild, excludeUserId) {
    const members = guild.members.cache.filter(member => 
        !member.user.bot && member.id !== excludeUserId
    );
    if (members.size === 0) return null;
    const randomMember = members.random();
    return randomMember;
}

module.exports = { isTimeAllowed, getRandomMember, getRandomMemberExcluding };
