import nltk
import os

if __name__ == '__main__':
    nltk.download('wordnet')
    get_synset = nltk.corpus.wordnet.synset_from_sense_key
    def get_id(sense_key):
        try:
            name = get_synset(sense_key).name()
        except Exception:
            name = ""
        return name
    output_file = '../dictionaries/nltk_ids.txt'
    if os.path.isfile(output_file):
        os.unlink(output_file)
    with open('public/data/sense_keys.txt', encoding='utf-8') as keys:
        with open(output_file, 'a', encoding='utf-8') as synset_map:
            for key in keys:
                key = key.rstrip()
                synset_map.write(get_id(key) + '\n')
