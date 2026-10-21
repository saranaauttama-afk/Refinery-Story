import urllib.request
def fetch(url,path):
    r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=120)
    open(path,'wb').write(r.read())
