library(lingmatch)
library(jsonlite)
library(yaml)
library(parallel)
library(udpipe)

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
      l <- sort(l[l / term_spaces[[i]] > .4], TRUE)
      if (length(l)) as.integer(names(l)) else NULL
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
      function(d){
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

# write synset resources
synset_ids <- structure(seq_along(by_synset), names = names(by_synset))
write_json(lapply(seq_along(by_synset), function(i) {
  d <- by_synset[[i]]
  d$partOfSpeech <- NULL
  d$example <- NULL
  d <- lapply(d, function(e) if (any(grepl("^\\d+-\\w$", e))) {
    unname(synset_ids[unlist(e)])
  } else {
    e
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
  tagged_file, sep = "\t", quote = "", col.names = c("term", "pos", "lemma")
)
tagged <- tagged[
  tagged$term != tagged$lemma & tagged$lemma != "<unknown>" &
    tagged$term %in% names(terms_indices) & tagged$lemma %in% names(terms_indices),
]
lemmas <- structure(numeric(length(terms_indices)), names = names(terms_indices))
lemmas[tagged$term] <- terms_indices[tagged$lemma]

# ## fill in some missed terms
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
