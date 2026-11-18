from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from datetime import datetime
from zoneinfo import ZoneInfo
import sys,json,re,subprocess

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[];self.title=False;self.descriptions=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if tag in ('a','link','script','img'):
   src=a.get('href') if tag in ('a','link') else a.get('src')
   if src:self.links.append(src)
  if tag=='meta' and a.get('name')=='description':self.descriptions.append(a.get('content'))
  if tag=='title':self.title=True
errors=[]
files=list(DIST.rglob('*.html'))
for f in files:
 p=Links();p.feed(f.read_text(encoding='utf8'))
 for url in p.links:
  if url.startswith(('#','https:','http:','mailto:','data:')):continue
  target=url.split('#',1)[0].split('?',1)[0]
  if not target:continue
  path=f.parent/unquote(target)
  if path.is_dir():path=path/'index.html'
  if not path.exists():errors.append(f'{f.relative_to(DIST)} broken link: {url}')
 if len(p.ids)!=len(set(p.ids)):errors.append(f'{f.relative_to(DIST)} duplicated ids')
 if len(p.descriptions)!=1:errors.append(f'{f.relative_to(DIST)} meta descriptions: {len(p.descriptions)}')
 if not p.title:errors.append(f'{f.relative_to(DIST)} missing title')

cities=json.loads((ROOT/'src/regions.json').read_text(encoding='utf8'))
expected={'brasilia':'2026-11-19T00:00:00-03:00','manaus':'2026-11-18T23:00:00-04:00','auckland':'2026-11-19T00:00:00+13:00','los-angeles':'2026-11-18T21:00:00-08:00'}
for cid,correct in expected.items():
 c=next(c for c in cities if c['id']==cid)
 actual=datetime.fromisoformat(c['utc'].replace('Z','+00:00')).astimezone(ZoneInfo(c['tz'])).isoformat()
 if actual!=correct: errors.append(f'{cid} wrong time: {actual}, expected {correct}')
print('HTML files:',len(files),'| city records:',len(cities),'| errors:',len(errors))
if errors:
 for error in errors[:30]:print('ERROR',error)
 sys.exit(1)
print('Checked all local href/src references, duplicate IDs, meta descriptions, and key time zone conversions.')
