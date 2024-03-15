const Discord = require("discord.js");
const colors = require("colors/safe");
const axios = require("axios");
var toHex = require("colornames");
const {
  pagination,
  ButtonTypes,
  ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

const { Dex } = require("@pkmn/dex");
const { Generations } = require("@pkmn/data");
const { Smogon } = require("@pkmn/smogon");
const gens = new Generations(Dex);
const smogon = new Smogon(fetch);

const {
  fetchPokemon,
  formatJsonToText,
  fetchPokemonBySpeciesUrl,
} = require("../../../functions/smogon");

const pokemonIndex = require('./pokemon.json');
function cleanPokemonName(name) {
  const replaceChar = name.replace(/-/g, ' ');
  return replaceChar.charAt(0).toUpperCase() + replaceChar.slice(1);
}

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("smogon")
    .setDescription("Smogon API")
    .addStringOption((option) =>
      option
        .setName("pokemon")
        .setDescription("O nome do Pokémon")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("generation")
        .setDescription("O número da geração (e.g., 8 para a geração 8)")
        .setRequired(true)
        .addChoices(
          { name: "Gen-1", value: 1 },
          { name: "Gen-2", value: 2 },
          { name: "Gen-3", value: 3 },
          { name: "Gen-4", value: 4 },
          { name: "Gen-5", value: 5 },
          { name: "Gen-6", value: 6 },
          { name: "Gen-7", value: 7 },
          { name: "Gen-8", value: 8 },
          { name: "Gen-9", value: 9 }
        )
    )
    .addStringOption((option) =>
      option
        .setName("format")
        .setDescription("The battle moveset format")
        .setRequired(true)
        .addChoices(
          { name: "1v1", value: "1v1" },
          { name: "2v2 Doubles", value: "2v2-doubles" },
          { name: "Almost Any Ability", value: "almost-any-ability" },
          { name: "Anything Goes (AG)", value: "ag" },
          { name: "Balanced Hackmons (BH)", value: "bh" },
          { name: "Doubles", value: "doubles" },
          { name: "Doubles Ubers", value: "doubles-ubers" },
          { name: "Doubles UU", value: "doubles-uu" },
          { name: "Inverse Battle", value: "inverse-battle" },
          { name: "Mix and Mega", value: "mix-and-mega" },
          { name: "Monotype", value: "monotype" },
          { name: "NeverUsed (NU)", value: "nu" },
          { name: "OverUsed (OU)", value: "ou" },
          { name: "PU", value: "pu" },
          { name: "RU", value: "ru" },
          { name: "Seasonal", value: "seasonal" },
          { name: "Tier Shift", value: "tier-shift" },
          { name: "Uber", value: "uber" },
          { name: "UnderUsed (UU)", value: "uu" },
          { name: "Untiered", value: "untiered" },
          { name: "ZeroUsed (ZU)", value: "zu" },
        )
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    if (focusedValue.length >= 3) {
      const filteredPokemon = pokemonIndex.data.filter(pokemon =>
        pokemon.name.startsWith(focusedValue)
      );

      const limitedChoices = filteredPokemon.slice(0, 25).map(pokemon => ({
        name: cleanPokemonName(pokemon.name),
        value: pokemon.name,
      }));
      
      await interaction.respond(limitedChoices);

    }
    else {
      return null
    }

  },

  async execute(interaction) {
    try {
      function getMovesetFormatNameByValue(value) {
        const movesetFormats = [
          { name: "1v1", value: "1v1" },
          { name: "2v2 Doubles", value: "2v2-doubles" },
          { name: "Almost Any Ability", value: "almost-any-ability" },
          { name: "Anything Goes (AG)", value: "ag" },
          { name: "Balanced Hackmons (BH)", value: "bh" },
          { name: "Doubles", value: "doubles" },
          { name: "Doubles Ubers", value: "doubles-ubers" },
          { name: "Doubles UU", value: "doubles-uu" },
          { name: "Inverse Battle", value: "inverse-battle" },
          { name: "Mix and Mega", value: "mix-and-mega" },
          { name: "Monotype", value: "monotype" },
          { name: "NeverUsed (NU)", value: "nu" },
          { name: "OverUsed (OU)", value: "ou" },
          { name: "PU", value: "pu" },
          { name: "RU", value: "ru" },
          { name: "Seasonal", value: "seasonal" },
          { name: "Tier Shift", value: "tier-shift" },
          { name: "Uber", value: "uber" },
          { name: "UnderUsed (UU)", value: "uu" },
          { name: "Untiered", value: "untiered" },
          { name: "ZeroUsed (ZU)", value: "zu" },
        ];

        const moveset = movesetFormats.find(format => format.value === value);
        return moveset ? moveset.name : null;
      }

      const generationInput = interaction.options.getInteger("generation");
      const pokemonNameInput = interaction.options.getString("pokemon");
      const movesetFormat = interaction.options.getString("format");

      if (generationInput >= 10) {
        return interaction.reply({
          content:
            "Essa geração é inválida. Por favor, forneça uma geração válida entre `1 <=> 9` !",
          ephemeral: true,
        });
      }

      const generationData = gens.get(generationInput);
      if (!generationData) {
        return interaction.reply(
          "A geração especificada não é suportada. Por favor, forneça uma geração entre 1 e 9."
        );
      }

      const pokemonData = await fetchPokemon(pokemonNameInput);
      if (!pokemonData) {
        return interaction.reply({
          content: "O Pokémon especificado não existe.",
          ephemeral: true,
        });
      }

      const dataMovesets = await smogon.sets(
        gens.get(generationInput),
        pokemonNameInput.toLowerCase(),
        "gen" + generationInput + movesetFormat
      );
      if (!dataMovesets || dataMovesets.length === 0) {
        return interaction.reply({
          content:
            "Não existe informação relativa a esse pokémon com as especificações dadas.\nTente usar o comando com outra geração (1-9) ou formato.`",
          ephemeral: true,
        });
      }

      const speciesResponse = await fetchPokemonBySpeciesUrl(
        pokemonData.species.url
      );

      const pokeColor = await toHex(speciesResponse.color || "#FFFFFF");

      const embeds = [];

      for (let i = 0; i < dataMovesets.length; i++) {
        const pokemonEmbed = new Discord.EmbedBuilder()
          .setColor(pokeColor ?? "White")
          .setTitle(dataMovesets[i].species + " #" + pokemonData.id)
          .setThumbnail(pokemonData.sprites.other.showdown.front_default)
          .addFields(
            {
              name: "**Nome do Moveset**",
              value:
                "```" +
                (dataMovesets[i].name
                  ? dataMovesets[i].name
                  : "Sem Informação") +
                "```",
            },
            {
              name: "**Geração do Moveset**",
              value: "```" + generationInput + "° Gen```",
              inline: true
            },
            {
              name: "**Formato do Moveset**",
              value: "```" + getMovesetFormatNameByValue(movesetFormat) + "```",
              inline: true
            },
            {
              name: "**Species**",
              value:
                "```" +
                (dataMovesets[i].species
                  ? dataMovesets[i].species
                  : "Sem Informação") +
                "```",
            },
            {
              name: "**Level**",
              value:
                "```" +
                (dataMovesets[i].level
                  ? dataMovesets[i].level
                  : "Sem Informação") +
                "```",
              inline: true,
            },
            {
              name: "**Item**",
              value:
                "```" +
                (dataMovesets[i].item
                  ? dataMovesets[i].item
                  : "Sem Informação") +
                "```",
              inline: false,
            },
            {
              name: "**Ability**",
              value:
                "```" +
                (dataMovesets[i].ability
                  ? dataMovesets[i].ability
                  : "Sem Informação") +
                "```",
              inline: true,
            },
            {
              name: "**Natures**",
              value:
                "```" +
                (dataMovesets[i].nature
                  ? dataMovesets[i].nature
                  : "Sem Informação") +
                "```",
              inline: true,
            },
            {
              name: "**Ivs**",
              value:
                "```" +
                (dataMovesets[i].ivs &&
                  Object.keys(dataMovesets[i].ivs).length > i
                  ? await formatJsonToText(dataMovesets[i].ivs)
                  : "Sem Informação") +
                "```",
              inline: false,
            },
            {
              name: "**Evs**",
              value:
                "```" +
                (dataMovesets[i].evs &&
                  Object.keys(dataMovesets[i].evs).length > i
                  ? await formatJsonToText(dataMovesets[i].evs)
                  : "Sem Informação") +
                "```",
              inline: false,
            },
            {
              name: "**Moves**",
              value:
                "```" +
                (dataMovesets[i].moves &&
                  Object.keys(dataMovesets[i].moves).length > i
                  ? await formatJsonToText(dataMovesets[i].moves)
                  : "Sem Informação") +
                "```",
              inline: false,
            },
          )
          .setTimestamp()
          .setFooter({
            text: `Page ${i} of ${dataMovesets.length.toString()}`,
          });

        if (generationInput >= 8) {
          pokemonEmbed.addFields({
            name: "**GigantaMax**",
            value: "```" + (dataMovesets[i].gigantaMax ? "✅" : "❌") + "```",
            inline: false,
          });
        }

        if (generationInput >= 9) {
          pokemonEmbed.addFields({
            name: "**TeraType**",
            value:
              "```" +
              (dataMovesets[i].teraType
                ? dataMovesets[i].teraType
                : "Sem Informação") +
              "```",
            inline: false,
          })
        }

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
            label: "Primeira Página",
            style: ButtonStyles.Primary,
            emoji: "⏮",
          },
          {
            type: ButtonTypes.previous,
            label: "Página Anterior",
            style: ButtonStyles.Success,
            emoji: "◀️",
          },
          {
            type: ButtonTypes.number,
            label: null,
            style: ButtonStyles.Success,
            emoji: "#️⃣",
          },
          {
            type: ButtonTypes.next,
            label: "Próxima Página",
            style: ButtonStyles.Success,
            emoji: "▶️",
          },
          {
            type: ButtonTypes.last,
            label: "Última Página",
            style: ButtonStyles.Primary,
            emoji: "⏭️",
          },
        ],
      });
    } catch (err) {
      console.log(colors.red(err));
    }
  },
};
