library(lingmatch)
library(jsonlite)
library(yaml)
library(parallel)

term_map <- select.lspace()$term_map
terms_indices <- structure(seq_len(nrow(term_map)), names = rownames(term_map))

baseDir <- "../dictionaries/"
preDir <- paste0(baseDir, "embedding_network/")
dir.create(preDir, FALSE, TRUE)

# extract most similar terms to each term in each space
# (very long process; skip to use any processed so far)
for (space in colnames(term_map)) {
  file <- paste0(preDir, space, ".json")
  if (!file.exists(file)) {
    top_terms <- list()
    s <- as(lma_lspace(space), "CsparseMatrix")
    parts <- ceiling(nrow(s) / 100)
    for (part in seq_len(parts)) {
      st <- proc.time()[[3]]
      start <- 1 + 100 * (part - 1)
      sims <- lma_simets(s[seq(start, min(start + 100, nrow(s))), ], s, metric = "cosine")
      for (term in rownames(sims)) {
        ts <- sims[term, ]
        ts <- sort(ts[ts > 0], TRUE)
        top_terms[[term]] <- terms_indices[names(ts[seq(2, min(length(ts), 101))])]
      }
      cat(part, "/", parts, "", proc.time()[[3]] - st, "\n")
    }
    write_json(top_terms, file)
  }
}

# tabulate the top terms across the pre-processed spaces
if (!file.exists(paste0(baseDir, "term_hits.rds"))) {
  files <- paste0(preDir, colnames(term_map), ".json")
  files <- files[file.exists(files)]
  top_sims <- lapply(
    structure(files, names = gsub("^[^/]+/|\\.json", "", files)), read_json
  )
  term_spaces <- as.list(rowSums(term_map != 0))
  terms_combined <- list()
  for (s in top_sims) {
    for (term in names(s)) {
      terms_combined[[term]] <- c(terms_combined[[term]], s[[term]])
    }
  }
  term_hits <- lapply(terms_combined, function(l) table(unlist(l)))
  saveRDS(term_hits, paste0(baseDir, "term_hits.rds"))
}

# select some proportion of top terms for each term
if (file.exists(paste0(baseDir, "term_hits_trimmed.json"))) {
  term_hits_trimmed <- read_json(paste0(baseDir, "term_hits_trimmed.json"))
} else {
  term_hits <- readRDS(paste0(baseDir, "term_hits.rds"))
  term_spaces <- as.list(rowSums(term_map != 0)[names(term_hits)])
  term_hits_trimmed <- lapply(
    structure(seq_along(term_hits), names = names(term_hits)),
    function(i) {
      l <- term_hits[[i]]
      if (length(l)) {
        su <- l / term_spaces[[i]] > .5
        l <- if (any(su)) {
          sort(l[su], TRUE)
        } else if (max(term_hits[[i]]) > 1) {
          term_hits[[i]][which.max(term_hits[[i]])]
        }
        as.integer(names(l))
      }
    }
  )
  write_json(term_hits_trimmed, paste0(baseDir, "term_hits_trimmed.json"), auto_unbox = TRUE)
}

# process wordnet data
if (!file.exists(paste0(baseDir, "wn_by_term.json"))) {
  if (!dir.exists(paste0(baseDir, "english-wordnet"))) {
    cd <- getwd()
    setwd(baseDir)
    system2("git", c("clone", "https://github.com/globalwordnet/english-wordnet.git"))
    setwd(cd)
    for (l in c("n", "y")) {
      path <- paste0(baseDir, "english-wordnet/src/yaml/entries-", l, ".yaml")
      if (readLines(path, 1) == paste0(toupper(l), ":")) {
        d <- readLines(path)
        d[[1]] <- paste0("__", l, ":")
        writeLines(d, path)
      }
    }
  }
  entry_files <- list.files(paste0(baseDir, "english-wordnet/src/yaml"), "entries")
  terms <- list()
  synset_keys <- list()
  for (file in entry_files) {
    d <- read_yaml(paste0(baseDir, "english-wordnet/src/yaml/", file))
    cat(file, length(d), "\n")
    for (term in names(d)) {
      groups <- d[[term]]
      if (term %in% c("__n", "FALSE", "__y", "TRUE")) {
        term <- c(
          "__n" = "N", "FALSE" = "no", "__y" = "Y", "TRUE" = "yes"
        )[term]
      }
      for (group in groups) {
        for (sense in group$sense) {
          synset_keys[[sense$synset]] <- sense$id
          for (e in names(sense)) {
            terms[[e]][[term]] <- c(terms[[e]][[term]], sense[[e]])
          }
        }
      }
    }
  }
  writeLines(unlist(synset_keys[names(by_synset)]), "public/data/sense_keys.txt")
  write_json(terms, paste0(baseDir, "wn_by_term.json"), auto_unbox = TRUE)
}

# conform terms to or expand embeddings term set
if (file.exists(paste0(baseDir, "term_synsets.rds"))) {
  terms_indices <- readRDS(paste0(baseDir, "terms_indices.rds"))
  term_synsets <- readRDS(paste0(baseDir, "term_synsets.rds"))
} else {
  terms <- read_json(paste0(baseDir, "wn_by_term.json"))
  synset_ids <- structure(seq_along(by_synset), names = names(by_synset))
  term_synsets <- list()
  all_terms <- names(terms_indices)
  for (term in names(terms$id)[-grep("^[0-9]+$", names(terms$id))]) {
    lower_term <- tolower(term)
    if (!lower_term %in% all_terms) {
      lower_term <- sub("'", "", lower_term)
      if (!lower_term %in% all_terms) {
        lower_term <- gsub(" ", "-", lower_term)
        if (!lower_term %in% all_terms) {
          lower_term <- tolower(term)
          terms_indices[[lower_term]] <- length(terms_indices) + 1
        }
      }
    }
    term_synsets[[lower_term]] <- unname(synset_ids[unlist(terms$synset[[term]])])
  }
  saveRDS(terms_indices, paste0(baseDir, "terms_indices.rds"))
  saveRDS(term_synsets, paste0(baseDir, "term_synsets.rds"))
}

# conform synset members to expanded term set
if (file.exists(paste0(baseDir, "by_synset.json"))) {
  by_synset <- read_json(paste0(baseDir, "by_synset.json"))
} else {
  files <- grep(
    "entries|frames", list.files(paste0(baseDir, "english-wordnet/src/yaml")),
    value = TRUE, invert = TRUE
  )
  cl <- makeCluster(detectCores() - 2)
  clusterExport(cl, c("baseDir", "terms_indices"))
  by_synset <- unlist(parLapplyLB(cl, files, function(file) {
    topic <- yaml::read_yaml(paste0(baseDir, "english-wordnet/src/yaml/", file))
    topic_name <- gsub("^[^.]+\\.|\\.yaml$", "", file)
    lapply(
      topic,
      function(d) {
        if (!is.null(d$members)) {
          members <- tolower(d$members)
          members <- members[!grepl("^\\d+$", members)]
          su <- !members %in% names(terms_indices)
          if (any(su)) {
            members[su] <- sub("'", "", members[su])
            su <- !members %in% names(terms_indices)
            if (any(su)) {
              members[su] <- gsub(" ", "-", members[su])
              su <- !members %in% names(terms_indices)
              if (any(su)) {
                stop("failed to conform members in ", file)
              }
            }
          }
          d$members <- unname(terms_indices[members])
        }
        d$topic <- topic_name
        d
      }
    )
  }), recursive = FALSE)
  stopCluster(cl)
  write_json(by_synset, paste0(baseDir, "by_synset.json"), auto_unbox = TRUE)
}

# synset clusters
synset_clusters_raw_file <- paste0(baseDir, "synset_clusters.tsv")
if (!file.exists(synset_clusters_raw_file)) {
  download.file(
    "https://github.com/SapienzaNLP/csi_code/raw/master/data/sensekey2csi_complete.tsv",
    synset_clusters_raw_file
  )
}
synset_clusters_json_file <- paste0(baseDir, "synset_clusters.json")
if (!file.exists(synset_clusters_json_file)) {
  synset_clusters_raw <- lapply(readLines(synset_clusters_raw_file), strsplit, "\t")
  synset_clusters <- structure(
    lapply(synset_clusters_raw, function(l) l[[1]][-1]),
    names = vapply(synset_clusters_raw, function(l) l[[1]][1], "")
  )
  jsonlite::write_json(synset_clusters, synset_clusters_json_file, auto_unbox = TRUE)
}
synset_keys <- readLines("public/data/sense_keys.txt")
synset_clusters <- jsonlite::read_json(synset_clusters_json_file)[synset_keys]

# synset NLTK IDs
nltk_ids_file <- paste0(baseDir, "nltk_ids.txt")
if (!file.exists(nltk_ids_file)) {
  system2("python3", "-m pip install nltk")
  system2("python3", "preprocess.py")
}
nltk_ids <- readLines(nltk_ids_file)

# synset frequencies
## http://lcl.uniroma1.it/wsdeval/
unified_framework_dir <- paste0(baseDir, "WSD_Evaluation_Framework")
unified_framework_freq_file <- paste0(unified_framework_dir, "/counts.csv")
if (!file.exists(unified_framework_freq_file)) {
  unified_framework_zip <- paste0(unified_framework_dir, ".zip")
  if (!file.exists(unified_framework_dir)) {
    if (!file.exists(unified_framework_zip)) {
      download.file(
        "http://lcl.uniroma1.it/wsdeval/data/WSD_Evaluation_Framework.zip",
        unified_framework_zip
      )
    }
    unzip(unified_framework_zip, exdir = baseDir)
    unlink(unified_framework_zip)
  }
  unified_framework_raw <- c(
    paste0(
      unified_framework_dir, c(
        "/Training_Corpora/SemCor+OMSTI/semcor+omsti.gold.key.txt",
        "/Data_Validation/sample-dataset/semeval2015.gold.key.txt",
        "/Evaluation_Datasets/ALL/ALL.gold.key.txt"
      )
    ),
    list.files(paste0(unified_framework_dir, "/Output_Systems_ALL"), full.names = TRUE)
  )
  counts <- as.data.frame(table(unlist(lapply(
    unique(unlist(lapply(unified_framework_raw, readLines))), function(e) strsplit(e, " ")[[1]][-1]
  ))))
  colnames(counts) <- c("sense_key", "count")
  write.csv(counts, unified_framework_freq_file, row.names = FALSE)
}
unified_framework_freqs <- read.csv(unified_framework_freq_file)
unified_framework_freqs <- structure(
  unified_framework_freqs$count,
  names = unified_framework_freqs$sense_key
)[synset_keys]

# BabelNet IDs
## https://sapienzanlp.github.io/xl-wsd/docs/data/
babelnet_ids_file <- paste0(baseDir, "babelnet_ids.json")
if (!file.exists(babelnet_ids_file)) {
  xl_framework_dir <- paste0(baseDir, "xl-wsd")
  xl_framework_zip <- paste0(xl_framework_dir, ".zip")
  if (!file.exists(xl_framework_dir)) {
    if (!file.exists(xl_framework_zip)) {
      download.file(
        paste0(
          "https://drive.usercontent.google.com/download?id=19YTL-Uq95hjiFZfgwEpXRgcYGCR_PQY0",
          "&export=download&confirm=t&uuid=a408515e-4e07-48b6-9068-860c762eee61"
        ),
        xl_framework_zip,
        mode = "wb"
      )
    }
    unzip(xl_framework_zip, exdir = baseDir)
    unlink(xl_framework_zip)
  }
  unified_framework_raw <- paste0(
    unified_framework_dir, "/Training_Corpora/SemCor/semcor.gold.key.txt"
  )
  xl_framework_raw <- paste0(
    xl_framework_dir, "/training_datasets/semcor_en/semcor_en.gold.key.txt"
  )
  unified <- lapply(
    readLines(unified_framework_raw), function(e) strsplit(e, " ")[[1]]
  )
  names(unified) <- vapply(unified, "[[", "", 1)
  xl <- lapply(
    readLines(xl_framework_raw), function(e) strsplit(e, " ")[[1]]
  )
  map <- list()
  for (l in xl) {
    id <- l[[1]]
    babelnet <- l[-1]
    wordnet <- unified[[id]][-1]
    if (length(babelnet) != length(wordnet)) {
      stop()
    }
    for (i in seq_along(babelnet)) {
      wid <- wordnet[[i]]
      map[[wid]] <- unique(c(map[[wid]], babelnet[[i]]))
    }
  }
  jsonlite::write_json(map, babelnet_ids_file, auto_unbox = TRUE)
}
babelnet_ids <- jsonlite::read_json(babelnet_ids_file)
babelnet_ids <- babelnet_ids[synset_keys]

# write synset resources
synset_ids <- structure(seq_along(by_synset), names = names(by_synset))
write_json(lapply(seq_along(by_synset), function(i) {
  d <- by_synset[[i]]
  d$csi_labels <- synset_clusters[[i]]
  nltk_id <- nltk_ids[[i]]
  if (nltk_id != "") d$sense_index <- as.integer(sub("^.*\\.", "", nltk_id))
  babelnet_id <- babelnet_ids[[i]]
  if (!is.null(babelnet_id)) d$babelnet <- babelnet_id
  count <- unified_framework_freqs[[i]]
  if (!is.na(count)) d$count <- count
  d$partOfSpeech <- NULL
  d$example <- NULL
  d <- lapply(d, function(e) {
    if (any(grepl("^\\d+-\\w$", e))) {
      unname(synset_ids[unlist(e)])
    } else {
      e
    }
  })
  d$id <- names(by_synset)[[i]]
  d
}), "public/data/synset_info.json", auto_unbox = TRUE)

# identify term roots
tagged_file <- paste0(baseDir, "terms_tagged.tsv")
if (!file.exists(tagged_file)) {
  if (!dir.exists(paste0(baseDir, "RNNTagger"))) {
    temp <- tempfile()
    options(timeout = 999)
    download.file(
      "https://www.cis.uni-muenchen.de/~schmid/tools/RNNTagger/data/RNNTagger-1.4.4.zip",
      temp
    )
    unzip(temp, exdir = baseDir)
    unlink(temp)
    rnntagger_cmd <- paste0(baseDir, "RNNTagger/cmd/rnn-tagger-english.sh")
    cmd_content <- readLines(rnntagger_cmd)
    out_line <- grep("$SCRIPTS", cmd_content, fixed = TRUE)
    cmd_content[out_line] <- sub(" $", " > $2", cmd_content[out_line])
    writeBin(charToRaw(paste0(c(cmd_content, ""), collapse = "\n")), rnntagger_cmd)
  }
  # requires Docker to be running
  system2("docker", c("compose", "up"))
  system2("docker", c("compose", "down"))
}
tagged <- read.table(
  tagged_file,
  sep = "\t", quote = "", col.names = c("term", "pos", "lemma")
)
tagged <- tagged[
  tagged$term != tagged$lemma & tagged$lemma != "<unknown>" &
    tagged$term %in% names(terms_indices) & tagged$lemma %in% names(terms_indices),
]
lemmas <- structure(numeric(length(terms_indices)), names = names(terms_indices))
lemmas[tagged$term] <- terms_indices[tagged$lemma]

# ## fill in some missed terms
# library(udpipe)
# if (!file.exists(paste0(baseDir, "english-partut-ud-2.5-191206.udpipe"))) {
#   udpipe_download_model(
#     language = "english-partut",
#     model_dir = baseDir,
#     udpipe_model_repo = "jwijffels/udpipe.models.ud.2.5"
#   )
# }
# model <- udpipe_load_model(paste0(baseDir, "english-partut-ud-2.5-191206.udpipe"))
# udpipe_tagged <- data.frame(udpipe_annotate(model, names(terms_indices), parser = "none"))
# tagged <- udpipe_tagged[
#   udpipe_tagged$token != udpipe_tagged$lemma &
#     udpipe_tagged$token %in% names(terms_indices) &
#     udpipe_tagged$lemma %in% names(terms_indices),
# ]
# su <- lemmas[tagged$token] == 0
# lemmas[tagged$token[su]] <- terms_indices[tagged$lemma[su]]

# write term resources
terms_sim_exp <- term_hits_trimmed[names(terms_indices)]
names(terms_sim_exp) <- names(terms_indices)
terms_wn_exp <- term_synsets[names(terms_indices)]
all_term_info <- lapply(
  seq_along(terms_wn_exp),
  function(i) {
    sinds <- terms_wn_exp[[i]]
    inds <- as.integer(terms_sim_exp[[i]])
    if (length(inds) || lemmas[[i]]) inds <- c(lemmas[[i]], inds)
    if (length(sinds)) list(inds, sinds) else if (length(inds)) list(inds) else integer()
  }
)
write_json(all_term_info, "public/data/term_associations.json", auto_unbox = TRUE)
writeLines(names(terms_indices), "public/data/terms.txt")
