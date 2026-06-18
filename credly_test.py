
import requests
import json
import re

url = 'https://www.credly.com/go/JByCyWiJ'
res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, allow_redirects=True)
print('Status:', res.status_code)
html = res.text

with open('credly_raw.html', 'w', encoding='utf-8') as f:
    f.write(html)

