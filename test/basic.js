
const geneticAlgorithmConstructor = require('../index.js');

module.exports = {

  'geneticalgorithm is a function': function(beforeExit, assert) {
    assert.equal('function', typeof geneticAlgorithmConstructor);
  },

  'constructor creates basic config': function(beforeExit, assert) {
    const geneticAlgorithm = geneticAlgorithmConstructor( {population: [{}]} );

    assert.equal('object', typeof geneticAlgorithm );
  },

  'complete successfully for evolutions': function(beforeExit, assert) {
    const config = {
		    mutationFunction: function(phenotype) {
        return phenotype;
      },
		    crossoverFunction: function(a, b) {
        return [a, b];
      },
		    fitnessFunction: function(phenotype) {
        return 0;
      },
		    population: [{name: 'bob'}],
    };
    const geneticalgorithm = geneticAlgorithmConstructor( config );

    geneticalgorithm.evolve();
    assert.equal( 'bob', geneticalgorithm.best().name );
  },


  'solve number evolution': function(beforeExit, assert) {
    const PhenotypeSize = 5;

    function mutationFunction(phenotype) {
		    const gene = Math.floor( Math.random() * phenotype.numbers.length );
		    phenotype.numbers[gene] += Math.random() * 20 - 10;
		    return phenotype;
    }

    function crossoverFunction(a, b) {
		    function cloneJSON( item ) {
		        return JSON.parse( JSON.stringify( item ) );
		    }
		    const x = cloneJSON(a); const y = cloneJSON(b); let cross = false;

		    for (const i in x.numbers) {
		        if ( Math.random() * x.numbers.length <= 1 ) {
          cross = !cross;
        }
		        if (cross) {
		            x.numbers[i] = b.numbers[i];
		            y.numbers[i] = a.numbers[i];
		        }
		    }
		    return [x, y];
    }

    function fitnessFunction(phenotype) {
		    let sumOfPowers = 0;
		    for (const i in phenotype.numbers) {
		        // assume perfect solution is '50.0' for all numbers
		        sumOfPowers += Math.pow( 50 - phenotype.numbers[i], 2);
		    }
		    return 1 / Math.sqrt(sumOfPowers);
    }

    function createEmptyPhenotype() {
		    const data = [];
		    for (let i = 0; i < PhenotypeSize; i += 1) {
		        data[i] = 0;
		    }
		    return {numbers: data};
    }
    let ga = geneticAlgorithmConstructor({
      mutationFunction: mutationFunction,
      crossoverFunction: crossoverFunction,
      fitnessFunction: fitnessFunction,
      population: [createEmptyPhenotype()],
    });


    ga = ga.clone();

    ga = ga.clone( ga.config() );

    ga.evolve();
    let lastScore = ga.bestScore();

    for ( let i = 0; i < 4 && lastScore < 1; i++ ) {
      for ( var j = 0; j < 4 * 5 * PhenotypeSize; j++ ) ga.evolve();
      const bestScore = ga.bestScore();
      assert.equal( true, bestScore > lastScore, i + ' ' + j + ' ' + lastScore);
      lastScore = bestScore;
    }

    assert.equal( true, ga.bestScore() > 1, 'Error : untrue : ' + ga.bestScore() + ' > 1');
  },
};

