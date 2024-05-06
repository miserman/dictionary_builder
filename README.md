React app to help create and analyze text analysis dictionaries.

# Features

**Import** an existing dictionary (such as from [osf.io/y6g5b](https://osf.io/y6g5b/)), or start from scratch.

Imported dictionaries are saved locally with every edit, which can be encrypted.

As part of _creation_, you can...

- add fixed or fuzzy (glob or regex) terms,
- add suggested terms based on word-form matching, embeddings-based similarity, or wordnet-based similarity,
- and assign terms a sense and category weights (directly, or automatically based on similarity to a given set of terms).

As part of _analysis_, the tool will...

- expand fuzzy terms using a word list extracted from embeddings,
- suggest senses from a wordnet, ranked by similarity to other terms that share a category,
- and calculate similarity to terms within select categories to visualize as a graph.

**Export** dictionaries in common formats, such as those accepts by [lingmatch](https://miserman.github.io/lingmatch/) for processing in R, and [adicat](https://miserman.github.io/adicat/highlight/) for processing in browser.

# Sources

Term associations come from the pre-trained embeddings spaces available at [osf.io/489he](https://osf.io/489he/).

Synsets are from the [Open English WordNet](https://github.com/globalwordnet/english-wordnet), with some added information:

- clusters from a [Coarse Sense Inventory](https://sapienzanlp.github.io/csi/)
- frequencies from an [evaluation framework](http://lcl.uniroma1.it/wsdeval/), which come from [SemCor](https://web.eecs.umich.edu/~mihalcea/downloads.html#semcor) and [OMSTI](https://www.comp.nus.edu.sg/~nlp/corpora.html)
- BabelNet IDs from another [evaluation framwork](https://sapienzanlp.github.io/xl-wsd/docs/data/), as mapped from SemCor labels

Additional associated terms are from [ConceptNet](https://github.com/commonsense/conceptnet5).

The [preprocess.R](/preprocess.R) script was used to make the resources from these sources that are used within the app.

Some background to this tool is discussed in [Introduction to Dictionary Creation](https://miserman.github.io/lingmatch/articles/dictionary_creation.html).

# Testing

Tests depend on a running dev server, which can be started with the `test-serve` command:

```sh
npm run test-serve
```

After the this has been compiled, the test had be run:

```sh
npm run test
```

Note: visit `http://localhost:3000/dictionary_builder` to compile before running tests.
