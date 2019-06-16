/* eslint-disable require-jsdoc */
const _ = require('lodash');

const Genetics = (options) => {
  function settingDefaults() {
    return {

      mutationFunction: async function (phenotype) {
        return phenotype;
      },

      crossoverFunction: async function (a, b) {
        return [a, b];
      },

      fitnessFunction: function (phenotype) {
        return 0;
      },

      doesABeatBFunction: undefined,

      population: [],
      populationSize: 100,
      elitism: 1.0,
    };
  }

  function settingWithDefaults(preferences, defaults) {
    const settings = { ...defaults, ...preferences };

    if (settings.population.length <= 0) {
      throw Error('population must be an array and contain at least 1 phenotypes');
    }
    if (settings.populationSize <= 0) {
      throw Error('populationSize must be greater than 0');
    }

    return settings;
  }

  let settings = settingWithDefaults(options, settingDefaults());

  async function populate() {
    const { population, populationSize } = settings;
    const size = settings.population.length;
    const populationDeficit = populationSize - population.length;
    if (populationDeficit <= 0) {
      return;
    }
    const extraPopulationPromises = Array(populationDeficit)
      .fill()
      .map(p => mutate({ ...settings.population[Math.floor(Math.random() * size)] }))

    const extraPopulation = await Promise.all(extraPopulationPromises);
    return [...settings.population, ...extraPopulation];
  }

  async function mutate(phenotype) {
    return await settings.mutationFunction({ ...phenotype });
  }

  async function crossover(phenotype) {
    phenotype = { ...phenotype };
    let mate = settings.population[Math.floor(Math.random() * settings.population.length)];
    mate = { ...mate };
    return await settings.crossoverFunction(phenotype, mate)[0];
  }

  function doesABeatB(a, b) {
    if (settings.doesABeatBFunction) {
      return settings.doesABeatBFunction(a, b);
    } else {
      return settings.fitnessFunction(a) >= settings.fitnessFunction(b);
    }
  }

  function orderPopulation() {
    settings.population = _.sortBy(settings.population, doesABeatB);
  }

  async function compete() {
    const nextGeneration = [];
    const { populationSize, elitism } = settings;
    const elite = Math.round(populationSize * elitism);
    if (elite > 0) {
      const populationMix = [];
      orderPopulation();

      for (let p = 0; p < elite; p += 1) {
        populationMix.push(settings.population[p]);
      }

      for (let p = 0; p < settings.population.length - elite; p += 1) {
        populationMix.push(settings.population[p]);
      }
      settings.population = populationMix;
    }

    randomizePopulationOrder(elite);

    for (let p = elite; p < settings.population.length; p += 1) {
      const phenotype = settings.population[p];

      const nextGenerationPromises = [];
      if (Math.random() < 0.5) {
        nextGenerationPromises.push(mutate(phenotype));
      } else {
        nextGenerationPromises.push(crossover(phenotype));
      }
      nextGeneration = await Promise.all(nextGenerationPromises);
      settings.population = nextGeneration;
    }
  }

  function randomizePopulationOrder(elite) {
    for (let index = elite; index < settings.population.length; index++) {
      const otherIndex = elite + Math.floor(Math.random() * (settings.population.length - elite));
      const temp = settings.population[otherIndex];
      settings.population[otherIndex] = settings.population[index];
      settings.population[index] = temp;
    }
  }

  return {
    evolve: async function (evolutions = 1, options) {
      if (options) {
        settings = settingWithDefaults(options, settings);
      }
      const evolvedPopulation = await populate();
      for (let evolutionsCompleted = 0; evolutionsCompleted < evolutions; evolutionsCompleted++) {
        settings.population = evolvedPopulation;
        await compete();
      }
      return this;
    },
    best: function (topPeople = 1) {
      const scored = _.uniqWith(
        this.scoredPopulation(settings.population),
        _.isEqual,
      )
      return scored.slice(0, topPeople);
    },
    bestScore: function () {
      return settings.fitnessFunction(this.best());
    },
    population: function () {
      return { ...this.config().population };
    },
    scoredPopulation: () => {
      return _.orderBy(
        settings.population.map(function (phenotype) {
          return {
            phenotype: { ...phenotype },
            score: settings.fitnessFunction(phenotype),
          };
        }),
        ['score'],
        ['desc'],
      )
    },
    config: function () {
      return { ...settings };
    },
    clone: function (options) {
      return geneticAlgorithmConstructor(
        settingWithDefaults(options,
          settingWithDefaults(this.config(), settings)
        )
      );
    },
  };
};

module.exports = {
  Genetics,
};
