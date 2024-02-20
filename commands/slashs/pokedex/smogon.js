const Discord = require('discord.js');
const colors = require('colors/safe');
const axios = require('axios');
var toHex = require('colornames');
const { pagination, ButtonTypes, ButtonStyles } = require('@devraelfreeze/discordjs-pagination');

const { Dex } = require('@pkmn/dex');
const { Generations } = require('@pkmn/data');
const { Smogon } = require('@pkmn/smogon');
const gens = new Generations(Dex);
const smogon = new Smogon(fetch);

const { fetchPokemon, formatJsonToText, fetchPokemonBySpeciesUrl } = require('../../../functions/smogon');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('smogon')
        .setDescription('Smogon API')
        .addIntegerOption(option =>
            option.setName('generation')
                .setDescription('O número da geração (e.g., 8 para a geração 8)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pokemon')
                .setDescription('O nome do Pokémon')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const generationInput = interaction.options.getInteger('generation');
            const pokemonNameInput = interaction.options.getString('pokemon');

            if (generationInput >= 10) {
                return interaction.reply({ content: 'Essa geração é inválida. Por favor, forneça uma geração válida entre `1 <=> 9` !', ephemeral: true });
            }

            const generationData = gens.get(generationInput);
            if (!generationData) {
                return interaction.reply('A geração especificada não é suportada. Por favor, forneça uma geração entre 1 e 9.');
            }

            const pokemonData = await fetchPokemon(pokemonNameInput);
            if (!pokemonData) {
                return interaction.reply({ content: 'O Pokémon especificado não existe.', ephemeral: true });
            }

            const dataMovesets = await smogon.sets(gens.get(generationInput), pokemonNameInput.toLowerCase());
            if (!dataMovesets || dataMovesets.length === 0) {
                return interaction.reply({ content: 'Não existe informação relativa a esse pokémon na geração `' + generationInput + '`', ephemeral: true });
            }

            const speciesResponse = await fetchPokemonBySpeciesUrl(pokemonData.species.url);

            const pokeColor = await toHex(speciesResponse.color || '#FFFFFF');

            const embeds = [];

            for (let i = 0; i < dataMovesets.length; i++) {
                const pokemonEmbed = new Discord.EmbedBuilder()
                    .setColor(pokeColor ?? 'White')
                    .setTitle(dataMovesets[i].species + ' #' + pokemonData.id)
                    .setThumbnail(pokemonData.sprites.front_default)
                    .addFields(
                        { name: '**Nome do Moveset**', value: '```' + (dataMovesets[i].name ? dataMovesets[i].name : 'Sem Informação') + '```' },
                        { name: '**Species**', value: '```' + (dataMovesets[i].species ? dataMovesets[i].species : 'Sem Informação') + '```', inline: true },
                        { name: '**Level**', value: '```' + (dataMovesets[i].level ? dataMovesets[i].level : 'Sem Informação') + '```', inline: true },
                        { name: '**Item**', value: '```' + (dataMovesets[i].item ? dataMovesets[i].item : 'Sem Informação') + '```', inline: false },
                        { name: '**Ability**', value: '```' + (dataMovesets[i].ability ? dataMovesets[i].ability : 'Sem Informação') + '```', inline: true },
                        { name: '**Natures**', value: '```' + (dataMovesets[i].nature ? dataMovesets[i].nature : 'Sem Informação') + '```', inline: true },
                        { name: '**Ivs**', value: '```' + (dataMovesets[i].ivs && Object.keys(dataMovesets[i].ivs).length > i ? await formatJsonToText(dataMovesets[i].ivs) : 'Sem Informação') + '```', inline: false },
                        { name: '**Evs**', value: '```' + (dataMovesets[i].evs && Object.keys(dataMovesets[i].evs).length > i ? await formatJsonToText(dataMovesets[i].evs) : 'Sem Informação') + '```', inline: false },
                        { name: '**Moves**', value: '```' + (dataMovesets[i].moves && Object.keys(dataMovesets[i].moves).length > i ? await formatJsonToText(dataMovesets[i].moves) : 'Sem Informação') + '```', inline: false },
                        { name: '**GigantaMax**', value: '```' + (dataMovesets[i].gigantaMax ? '✅' : '❌') + '```', inline: false },
                        { name: '**TeraType**', value: '```' + (dataMovesets[i].teraType ? dataMovesets[i].teraType : 'Sem Informação') + '```', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Page ${i} of ${dataMovesets.length.toString()}` });

                embeds.push(pokemonEmbed);
            }

            await pagination({
                interaction: interaction,
                embeds: embeds,
                author: interaction.member.user,
                time: 60000,
                fastSkip: true,
                disableButtons: true,
                customFilter: (newestInteraction) => {
                    return newestInteraction.user.id === interaction.user.id;
                },
                buttons: [
                    {
                        type: ButtonTypes.first,
                        label: 'Primeira Página',
                        style: ButtonStyles.Primary,
                        emoji: '⏮'
                    },
                    {
                        type: ButtonTypes.previous,
                        label: 'Página Anterior',
                        style: ButtonStyles.Success,
                        emoji: '◀️'
                    },
                    {
                        type: ButtonTypes.number,
                        label: null,
                        style: ButtonStyles.Success,
                        emoji: '#️⃣'
                    },
                    {
                        type: ButtonTypes.next,
                        label: 'Próxima Página',
                        style: ButtonStyles.Success,
                        emoji: '▶️'
                    },
                    {
                        type: ButtonTypes.last,
                        label: 'Última Página',
                        style: ButtonStyles.Primary,
                        emoji: '⏭️'
                    }
                ]
            });


        }
        catch (err) {
            console.log(colors.red(err));
        }
    },
};