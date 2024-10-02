const { REST, Routes } = require('discord.js');
const { discordBotToken } = require('./config.json'); // Importa o token correto do config.json

// Client ID (pegue do Discord Developer Portal)
const clientId = 'SEU_ID_AQUI'; // Substitua pelo seu clientId

const commands = [
  {
    name: 'configbot',
    description: 'Configure as opções do bot no servidor.',
  },
];

const rest = new REST({ version: '10' }).setToken(discordBotToken); // Certifique-se de usar 'discordBotToken'

(async () => {
  try {
    console.log('Começando a registrar o comando...');

    // Registra o comando na API do Discord
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('Comando registrado com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar o comando:', error);
  }
})();
