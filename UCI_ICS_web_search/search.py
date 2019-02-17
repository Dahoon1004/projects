'''
program that searchs urls stored in inverted_index.json file given query.
'''
import sys
import nltk
from nltk.stem.snowball import SnowballStemmer
from nltk.corpus import stopwords
from pymongo import MongoClient
import json
from nltk.corpus import wordnet



class Searcher:
    def __init__(self):        
        self.bookkeeping = self.dict_from_json('webpages/WEBPAGES_RAW/bookkeeping.json')
        self.client = MongoClient("mongodb+srv://dbUser:1234@informationretrieval-g4n2e.mongodb.net/test?retryWrites=true")
        self.db = self.client.test
        self.mycol = self.db['termID']
        self.stopword_list = stopwords.words('english')
        self.stemmer = SnowballStemmer("english", ignore_stopwords=True)
        self.lem = nltk.WordNetLemmatizer()


    '''
    def load_index(self):
        result = dict()
        for obj in self.mycol.find({}):
            if wordnet.synsets(obj['termID']):
                result[obj['termID']] = obj['parsed_list']
        return result
    '''
    def dict_from_json(self, file_name):
        with open(file_name) as f:
            data = json.load(f)
        f.close()
        return data
    
    
    
    def split_parsed(self, parsed):
        result = list()
        string_list = list(parsed.split('\t'))
        result.append(string_list[0])
        result.append(float(string_list[1]))
        result.append(int(string_list[2]))
        result.append(string_list[3])
        result.append(float(string_list[4]))
        return result
    
    '''
    returns the list of words that are stemmed and lemmatized, ignores stopwords
    '''
    def get_words(self, query):
        result = list()
        query = query.split(' ')
        
        for word in query:
            if word not in self.stopword_list:
                word = self.lem.lemmatize(word)
                word = self.stemmer.stem(word)
                result.append(word)
        return result
    
    '''
    for each query term, get the weight
    if the query term does not exist in corpus,
    weight is set to 0
    '''
    def get_query_score(self, query_list):
        weight_dict = dict()
        
        for term in query_list:
            try:
                obj = self.mycol.find_one({ 'termID': term })
                parsed_list_string = obj['parsed_list']
                query_weight = -1
                
                
                
                for parsed_string in parsed_list_string.split('\n'):                
                    thing = self.split_parsed(parsed_string)
                    if query_weight == -1:
                        query_weight = thing[4] / thing[1]    
                    if weight_dict.has_key(thing[0]):
                        weight_dict[thing[0]] += query_weight * thing[4] / len(query_list) + thing[2] 
                        
                    else:
                        weight_dict[thing[0]] = query_weight * thing[4] / len(query_list)  + thing[2]    
                    
                    
            except:
                print('this does not exist')
        
        for doc in weight_dict.keys():
            weight_dict[doc] = weight_dict[doc]
        
        return weight_dict
    
    
    '''
    returns list of top k urls from scores dict
    '''
    def get_urls(self, scores, k):
        result = list()
        count = 0
        for thing in sorted(scores.items(), key=lambda x: x[1], reverse=True):
            count += 1
            result.append(self.bookkeeping[thing[0]])
            if count == 10:
                break
        return result
 
'''
if __name__ == '__main__':
    search = Searcher()
    
    for thing in search.get_urls(search.get_query_score(search.get_words("Artificial Intelligence")), 10):
        print(thing)
    
'''        