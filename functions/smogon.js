const axios = require('axios');

module.exports = {
    fetchPokemon: async function (pokemonName) {
        try {
            // TODO: return when no pokemonName is provided
            return await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase().replaceAll(' ', '-')}`)
                .then(response => {
                    const pokemon = response.data;

                    const abilities = pokemon.abilities;
                    // const abilities = pokemon.abilities.map(ability => ability.ability.name).join(', ');
                    const baseExp = pokemon.base_experience;
                    const forms = pokemon.forms;
                    // const forms = pokemon.forms.map(form => form.forms.map(form => form.form.name)).join(', ');
                    const height = pokemon.height;
                    const id = pokemon.id;
                    // const inicial = pokemon.is_default;
                    const moves = pokemon.moves;
                    const name = pokemon.name;
                    const species = pokemon.species;
                    const sprites = pokemon.sprites;
                    const stats = pokemon.stats;
                    const types = pokemon.types;
                    const weight = pokemon.weight;

                    return {
                        pokemon,
                        abilities,
                        baseExp,
                        forms,
                        height,
                        id,
                        // inicial,
                        moves,
                        name,
                        species,
                        sprites,
                        stats,
                        types,
                        weight
                    };
                })
                .catch(error => {
                    return null;
                });
        }
        catch (error) {
            console.error(error);
            return null;
        }
    },

    fetchPokemonBySpeciesUrl: async function (pokemonSpeciesUrl) {
        try {
            return await axios.get(pokemonSpeciesUrl)
                .then(response => {
                    const pokemonSpecie = response.data;

                    const color = pokemonSpecie.color.name;

                    return {
                        color
                    }
                })
                .catch(error => {
                    return null;
                });
        }
        catch (error) {
            console.error(error);
            return null;
        }
    },

    formatJsonToText: async function (input) {
        // TODO: return when no input is provided
        try {
            let text = '';

            for (const key in input) {
                let formattedKey = key;
                if (!isNaN(key)) {
                    formattedKey = (+key + 1).toString();
                }
                text += `${formattedKey.toUpperCase()} - ${input[key]}\n`;
            }

            return text;
        }
        catch (error) {
            console.error(error);
        }
    },

    translatedPokemonTypes: async function (type) {
        try {
            if (!type) {
                return null;
            }

            const translatedTypes = {
                normal: 'Normal',
                fire: 'Fogo',
                water: 'Água',
                electric: 'Elétrico',
                grass: 'Grama',
                ice: 'Gelo',
                fighting: 'Lutador',
                poison: 'Veneno',
                ground: 'Terra',
                flying: 'Voador',
                psychic: 'Psíquico',
                bug: 'Inseto',
                rock: 'Pedra',
                ghost: 'Fantasma',
                dragon: 'Dragão',
                dark: 'Dark',
                steel: 'Metal',
                fairy: 'Fada'
            };

            return new Promise((resolve, reject) => {
                const translated = type.map(type => translatedTypes[type] || type);
                resolve(translated);
            });

        }
        catch (error) {
            console.error(error.stack || error);
        }
    }

}