"""
Program to build index from corpus
"""
import math
from pymongo import MongoClient
import re
#for parsing text
import nltk
from nltk.stem.snowball import SnowballStemmer
#to filter out stop words
from nltk.corpus import stopwords
#for parsing html
from bs4 import BeautifulSoup
#for reading json file
import json

'''
inverted_index = {termID : [[docID, frequency, importance, tf-idf]]}
bookkeeping - { docPath : url }
'''
class indexBuilder:
    def __init__(self):      
        self.inverted_index = dict()        
        self.bookkeeping = self.get_dict_from_json()
        self.numOfDocuments = len(self.bookkeeping)
        
        
        self.create_index()
        
        for key in self.inverted_index:
            num_docs_with_term = len(self.inverted_index[key])
            for info in self.inverted_index[key]:
                frequency = info[1]                
                tf_idf = math.log10(float(self.numOfDocuments) / num_docs_with_term) * frequency
                tf_idf = round(tf_idf, 4)
                info.append(tf_idf)
        
       
        ''' 
        for term, parsed_list_string in temp.items():
            print(term)
            for parsed_string in parsed_list_string.split('\n'):
                
                thing = split_parsed(parsed_string)
                print(thing)
        '''        
        
        print('inverted index created !!')
        
       
        client = MongoClient("mongodb+srv://dbUser:1234@informationretrieval-g4n2e.mongodb.net/test?retryWrites=true")
        db = client.test
        mycol = db['termID']
        
        
        
        add_list = []
        for term, parsed_list in self.inverted_index.items():
            myDict = { 'termID' : term, 'parsed_list' : parse_list_to_big_string(parsed_list)}
            add_list.append(myDict)
        mycol.insert_many(add_list)
        
        print('inverted index stored in database!!')
        
        
    def create_index(self):
        
        for loc in sorted(self.bookkeeping):
            print(loc)            
            temp = self.list_of_tokens(loc)
            for t_info in temp:
                termID = t_info[0]
                docID = t_info[1]
                frequency = t_info[2]
                importance = t_info[3]                
                index_list = t_info[4]
                tup = [docID, frequency, importance, index_list]
                if self.inverted_index.has_key(termID):
                    self.inverted_index[termID].append(tup)
                else:
                    self.inverted_index[termID] = [tup]
        
    
        
        
        
        
     
    '''
    returns dictionary from json file
    '''
    def get_dict_from_json(self):
        with open('webpages/WEBPAGES_RAW/bookkeeping.json') as f:
            data = json.load(f)
        f.close()
        return data
    
    #returns the list of (token, docId) where docId = location of doc e.g. '0/0'
    '''
    given file_location which is basically docID
    returns the sorted list of (token, doc, frequency, importance) for that specific document.
    updates the dictionary, {'termID': numberOfDocs}
    '''
    def list_of_tokens(self, file_location):
        token_dict = dict()
        header_tokens = set()        
        stopword_list = stopwords.words('english')
        lem = nltk.WordNetLemmatizer()
        stemmer = SnowballStemmer("english", ignore_stopwords=True)
        with open('webpages/WEBPAGES_RAW/' + file_location) as f:
            soup = BeautifulSoup(f, 'lxml')
            for script in soup(["script", "style"]):
                script.extract()    # rip it out
            header_tokens = self.header_terms(soup)
            text = soup.text
            
        tokens = nltk.word_tokenize(text)          
        index = 0;
        for word in tokens:
            for token in re.split(r"[^a-zA-Z0-9\s]", word):     
                token = lem.lemmatize(token).lower()
                if token in stopword_list:
                    break
                token = stemmer.stem(token)      
                if re.match('[A-Za-z0-9]+', token) and len(token) >= 3:                      
                    if token_dict.has_key((token,file_location)): 
                        a = token_dict[(token, file_location)][0] + 1
                        b = token_dict[(token, file_location)][1] + ','+ str(index)                        
                        token_dict[(token, file_location)] = (a, b)                                    
                    else:
                        token_dict[(token, file_location)] = (1, str(index))
                    index+= 1                    
                    
        f.close()
        
        result = list()
        for pairA,pairB  in token_dict.items():
            importance = 0
            if pairA[0] in header_tokens:
                importance = 1
            result.append((pairA[0],pairA[1], round(math.log10(pairB[0]) + 1, 4), importance, pairB[1] ))
        
        list.sort(result)
        return result
        
    '''
    returns the list of tokens in header
    '''
    def header_terms(self, soup):
        header_token_set = set()
        lem = nltk.WordNetLemmatizer()
        stemmer = SnowballStemmer("english", ignore_stopwords=True)
        for thing in soup.find_all('title'):
            tokens = nltk.word_tokenize(thing.get_text())
            for word in tokens:
                for token in re.split(r"[^a-zA-Z0-9\s]", word):
                    token = lem.lemmatize(token)
                    token = stemmer.stem(token)
                    header_token_set.add(token)                    
        return header_token_set
            
    
   
    
                
def list_to_string(parser_list):
    result = ""
    result += str(parser_list[0]) + '\t'
    result += str(parser_list[1]) + '\t'
    result += str(parser_list[2]) + '\t'
    result += parser_list[3] + '\t'
    result += str(parser_list[4])
    return result

        
def parse_list_to_big_string(parser_list):
    result = ""
    for parsed in parser_list:
        result += list_to_string(parsed) + '\n'
    return result[:-2]


if __name__ == '__main__':
    #nltk.download('punkt')
    #nltk.download('stopwords')
    #nltk.download('wordnet')
    irBuilder = indexBuilder()
    
    
    