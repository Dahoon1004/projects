from Tkinter import *
from search import Searcher
import webbrowser

master = Tk()
master.title('ICS Web Search')
master.geometry('200x100') 
searcher = Searcher()

c = Label(master, text="ICS Information Retrieval System")
c.pack()

e = Entry(master)
e.pack()

e.delete(0, END)
e.insert(0, "Insert Query Here")

chrome_path = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s'


def open_web(website):
    webbrowser.get(chrome_path).open(website)



def new_winF(search_result):
    newwin = Toplevel(master)
    t = Label(newwin, text="Top 10 Results for: " + e.get())
    t.pack()
    for url in search_result:       
        display = Button(newwin, text=url, command= lambda x=url: open_web(x))
        display.pack(anchor='w')
        
    e.delete(0, END)


def callback():
    try:
        result = searcher.get_urls(searcher.get_query_score(searcher.get_words(e.get())), 10)
        if len(result) ==0:
            errorwin = Toplevel(master)
            t = Label(errorwin, text="No results for the query:")
            t.pack()
            k = Label(errorwin, text='"' + e.get() + '"')
            k.pack()
        else:
            new_winF(result)
    except:
        errorwin = Toplevel(master)
        t = Label(errorwin, text="No results for the query: " + e.get())
        t.pack()


b = Button(master, text="SEARCH", command=callback)
b.pack()


if __name__ == "__main__" :
    
    mainloop()