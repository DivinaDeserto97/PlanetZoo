#!/usr/bin/env python3
"""Einmaliger Datenimport: öffentlich tabellierte PZ2-Zoopedia-Kennzahlen.
Sekundärquelle (Stand 14.10.2026): https://pz2guide.com/animal-requirements/
Die Werte wurden NICHT für jede Art direkt auf Frontiers Website unabhängig geprüft.
Unbekannte Spielmechaniken (Sprung, sichere Trennung etc.) werden nicht erfunden.
"""
from __future__ import annotations
import json, re, unicodedata
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCE='https://pz2guide.com/animal-requirements/'
# Art|Land Basis|Land Zusatz|Unterschlupf je Tier|weitere Flächen|Zaunstufe|Zaunhöhe|klettersicher|Temperatur|Gruppe
HABITAT = '''
Aardvark|160|80|10|-|2|1|no|14,36|1,2
African Leopard|705|110|10|climbable:45,15|3|3|yes|14,36|1,2
African Penguin|180|3|2|deep:67,2;aquatic:135,2|2|1|no|3,36|6,500
African Savannah Elephant|502|502|56|aquatic:25,25|4|3|no|14,36|2,16
African Wild Dog|930|100|10|-|2|3|no|14,36|2,27
Asian Elephant|376|376|55|aquatic:25,25|4|3|no|14,36|3,30
Asian Small-Clawed Otter|120|30|5|deep:30,8;aquatic:40,12|2|1.25|no|18,33|2,15
Bactrian Camel|650|100|-|-|2|1.25|no|-40,40|2,11
Binturong|182|18|4|climbable:60,16|2|3|yes|18,33|1,5
Black Rhinoceros|770|770|40|-|4|2|no|14,41|1,3
Black Wildebeest|410|40|10|-|2|1.25|no|14,36|4,20
Blue Wildebeest|410|40|10|-|2|1.25|no|14,36|4,20
Cape Buffalo|420|90|15|aquatic:20,10|3|1.25|no|14,36|3,15
Common Hippopotamus|502|251|35|aquatic:502,251|4|2|no|14,36|3,30
Common Ostrich|300|300|10|-|2|1.25|no|14,36|1,8
Common Warthog|290|10|10|-|2|1.25|no|14,36|1,7
Eurasian Beaver|300|35|5|deep:45,15;aquatic:210,26|2|1.25|no|-5,30|2,8
Eurasian Brown Bear|970|145|30|aquatic:30,5|3|3|yes|-15,28|1,2
Eurasian Lynx|615|165|10|climbable:20,5|2|3|yes|-25,28|1,3
European Bison|420|105|15|-|3|1.25|no|-15,28|2,13
Galápagos Giant Tortoise|230|5|10|-|1|1|no|18,33|1,4
Gemsbok|270|40|10|-|2|1.25|no|14,41|5,10
Gharial|110|16|-|deep:120,52;aquatic:300,30|2|1|no|14,41|1,7
Giant Panda|650|150|15|-|4|2|yes|14,33|1,10
Golden Lion Tamarin|55|15|2|climbable:15,5|1|3|yes|18,33|2,8
Goodfellow's Tree-Kangaroo|200|50|7.5|climbable:20,10|1|1|yes|18,33|1,2
Grey Wolf|1162|92|10|-|3|3|no|-18,29|2,12
Grizzly Bear|970|145|30|aquatic:30,5|4|2|yes|-15,28|1,2
Komodo Dragon|285|285|25|aquatic:15,15|2|1|no|18,33|1,2
Lion|810|110|10|-|3|3|yes|14,41|2,30
Malayan Tapir|430|56|12|aquatic:37,19|2|1.25|no|18,33|1,2
Masai Giraffe|1500|125|25|-|2|1.25|no|12,36|3,12
Meerkat|180|14|2|-|1|1.25|no|14,41|2,30
Mountain Hare|200|90|5|-|1|1.25|no|-30,25|1,5
Nile Monitor|220|40|-|aquatic:30,15|2|0.5|no|20,41|1,3
North Sulawesi Babirusa|350|150|10|-|2|1.25|no|18,33|1,5
Nyala|340|40|10|-|2|1.25|no|14,41|1,5
Plains Zebra|460|140|10|-|2|1.25|no|14,36|3,6
Przewalski's Horse|460|140|10|-|2|1.25|no|-26,36|3,8
Red Deer|360|45|10|-|2|1.25|no|-5,28|3,9
Red Panda|160|80|5|climbable:60,20|2|3|no|-6,28|1,2
Reticulated Giraffe|1500|125|25|-|3|2|no|12,36|3,12
Ring-Tailed Lemur|210|8|2|climbable:20,4|2|3|yes|18,33|3,30
Sable Antelope|450|60|12.5|-|2|1.25|no|14,36|3,11
Saltwater Crocodile|155|15|-|deep:30,7.5;aquatic:75,25|3|1|no|18,33|1,7
Siamang|240|40|10|climbable:60,20|2|3|yes|18,33|2,6
Snow Leopard|705|110|10|-|2|3|yes|-25,10|1,2
Spotted Hyena|940|180|10|-|3|3|no|14,41|2,3
Springbok|425|55|11|-|2|1.25|no|14,41|3,36
Sumatran Orangutan|780|50|15|climbable:120,40|3|3|yes|18,33|1,6
Sumatran Tiger|705|110|10|climbable:30,10;aquatic:40,10|3|3|yes|18,33|1,2
Sun Bear|920|135|20|climbable:30,15;aquatic:30,15|3|3|yes|18,33|1,2
Sunda Pangolin|35|35|5|climbable:16,4|2|3|yes|18,33|1,2
Thomson's Gazelle|425|55|11|-|2|1.25|no|14,36|3,36
Western Chimpanzee|780|50|10|climbable:80,30|3|3|yes|18,33|5,15
Western Lowland Gorilla|1160|80|15|climbable:40,20|3|3|yes|18,33|3,6
Wild Boar|310|15|10|-|2|1.25|no|-6,36|3,30
'''
# Vogel|Land Basis|Land Zusatz|Flug Basis|Flug Zusatz|Unterschlupf/Tier|Zaun|Höhe|Temp|Gruppe
AVIARY = '''
Eurasian Bittern|40|40|20|20|10|2|1|-6,25|1,2
Golden Eagle|400|200|50|50|10|2|1|-30,30|1,2
Great Hornbill|80|40|50|20|5|2|1|18,33|2,10
Greater Flamingo|100|6|60|2|2|1|1|14,33|20,500
Javan Green Magpie|50|25|25|5|2|1|1|18,33|1,2
Long-Eared Owl|250|50|50|40|5|2|1|-14,36|1,2
Long-Tailed Parakeet|6|6|6|6|1|2|1|18,33|2,12
Secretarybird|200|100|60|25|10|2|1|14,36|1,2
Shoebill|200|200|50|15|5|2|1|14,33|1,2
Toco Toucan|50|25|20|10|10|2|1|14,36|1,2
White-Backed Vulture|475|100|60|25|10|2|1|14,41|6,80
White-Tailed Sea-Eagle|400|200|50|50|10|2|1|-20,28|1,2
'''
# Art|Tiefwasser Basis|Zusatz|Salinität|Temp|Gruppe
AQUARIUM = '''
African Tigerfish|100|30|Freshwater|22,30|1,5
Blackspotted Puffer|16|40|Saltwater|23,27|1,4
Blacktip Reef Shark|210|105|Saltwater|22,28|1,10
Blue and Gold Fusilier|50|15|Saltwater|21,31|1,4
Bluespine Unicornfish|50|15|Saltwater|24,29|1,5
Blunthead Cichlid|50|15|Freshwater|24,27|1,5
Boeseman's Rainbowfish|50|15|Freshwater|25,28|1,4
Brown Trout|50|15|Freshwater|12,19|1,5
Clown Anemonefish|50|15|Saltwater|24,28|1,5
Clown Loach|100|30|Freshwater|25,30|1,5
Clown Triggerfish|16|16|Saltwater|23,30|1,2
Common Rudd|50|15|Freshwater|18,24|1,4
Dolphinfish|400|50|Saltwater|24,28|1,4
Giant Gourami|100|30|Freshwater, Brackish|24,28|1,5
Giant Grouper|150|150|Brackish, Saltwater|24,29|1,5
Golden Trevally|100|30|Saltwater|24,30|1,5
Great Hammerhead|960|240|Saltwater|20,28|1,2
Hawksbill Turtle|100|25|Brackish, Saltwater|22,30|1,4
Humphead Wrasse|60|12.5|Saltwater|22,30|1,10
Indian Ocean Oriental Sweetlips|100|30|Saltwater|24,28|1,5
Indo-Pacific Leopard Shark|36|18|Saltwater|24,29|1,20
Indo-Pacific Sergeant|50|15|Saltwater|24,28|1,4
Javanese Cownose Ray|80|15|Brackish, Saltwater|24,30|5,40
Koi|50|15|Freshwater|18,25|1,5
Longfin Batfish|100|30|Saltwater|22,28|1,5
Ocean Sunfish|300|200|Saltwater|10,25|1,3
Ocellated Eagle Ray|180|45|Saltwater|24,27|1,16
Pacific Bluefin Tuna|200|60|Saltwater|17,26|1,5
Pacific Sardine|50|15|Brackish, Saltwater|15,26|1,3
Palette Surgeonfish|50|15|Saltwater|23,28|1,5
Red Lionfish|16|16|Saltwater|22,28|1,20
Sailfin Snapper|40|40|Saltwater|22,29|1,10
Sand Tiger Shark|420|240|Saltwater|16,28|2,6
Schooling Bannerfish|50|15|Saltwater|24,28|1,4
Threespot Damselfish|50|15|Saltwater|24,28|1,5
West Indian Manatee|20|5|Any Salinity|23,30|1,8
Yellow Tang|50|15|Saltwater|24,28|1,4
'''
# Art|Temp min,max|Luftfeuchte min,max|Gruppe
EXHIBIT = '''
Amazonian Giant Centipede|23,29|50,84|1,2
American Bullfrog|23,29|60,80|1,4
Axolotl|15,20|80,90|1,5
Boa Constrictor|23,31|60,80|1,2
Cloudless Sulphur|21,28|50,84|1,8
Common Bluetongue|25,35|50,60|1,2
Danube Crested Newt|12,25|55,75|1,6
Desert Horned Viper|23,31|15,25|1,4
Diamondback Terrapin|21,32|65,80|1,8
Eastern Brown Snake|23,29|60,85|1,5
European Peacock|18,25|60,80|1,8
Fire Salamander|15,24|60,75|1,6
Giant Forest Scorpion|21,30|65,85|1,6
Giant Malaysian Leaf Insect|22,30|50,70|1,2
Giant Slippery Frog|26,32|74,86|1,2
Giant Tiger Land Snail|20,28|70,80|1,3
Gila Monster|24,32|15,25|1,4
Golden Poison Frog|26,31|80,90|1,2
Goliath Beetle|23,36|40,60|1,3
Lehmann's Poison Frog|26,31|80,90|1,2
Menelaus Blue Morpho|21,35|65,85|1,8
Mexican Redknee|23,29|40,60|1,2
Monarch|21,30|40,60|1,8
Moon Jelly|9,19|80,90|1,3
Old World Swallowtail|18,24|40,60|1,8
Red-Eyed Tree Frog|26,31|80,90|1,5
Sacred Scarab Beetle|20,35|40,60|1,3
Sri Lankan Rose|21,35|40,60|1,8
Western Diamondback Rattlesnake|24,30|40,60|1,2
Yellow Anaconda|25,30|80,90|1,2
'''
# Angeglichene/fehlerhafte englische Namen der hochgeladenen Tierdateien.
ALIASES={
 'afrikan leopard':'african leopard','afrikan penguin':'african penguin',
 'afrikan tigerfish':'african tigerfish','afrikan savanna elephant':'african savannah elephant',
 'eurasienn bittern':'eurasian bittern','eurasienn beaver':'eurasian beaver',
 'eurasienn lynx':'eurasian lynx','eurasienn brown bear':'eurasian brown bear',
 'indian giant scorpion':'giant forest scorpion',
 'mexican red knee tarantula':'mexican redknee',
 'blue morpho':'menelaus blue morpho','oriental sweetlips':'indian ocean oriental sweetlips',
 'goodfellows tree kangaroo':'goodfellows tree kangaroo',
}
BY_ID={
 'amphiprion-ocellaris':'Clown Anemonefish', 'elephas-maximus':'Asian Elephant',
 'lycaon-pictus':'African Wild Dog','osphronemus-goramy':'Giant Gourami',
 'phoenicopterus-roseus':'Greater Flamingo','scarabaeus-sacer':'Sacred Scarab Beetle',
 'scolopendra-gigantea':'Amazonian Giant Centipede','trichechus-manatus':'West Indian Manatee',
 'Ursus arctos horribilis':'Grizzly Bear',
 'Brachypelma hamorii':'Mexican Redknee','Phoenicopterus roseus':'Greater Flamingo',
}
def normal(w):
 w=unicodedata.normalize('NFKD',str(w)).encode('ascii','ignore').decode().lower()
 return re.sub('[^a-z0-9]','',w)
def number(x): return float(x) if '.' in x else int(x)
def pair(s):
 a,b=s.split(',');return {'min':number(a),'max':number(b)}
def fl(b=0,plus=0):return {'basis':number(str(b)), 'jeWeiteresTier':number(str(plus)), 'jeJungtier':None}
def blanks():return {k:fl() for k in ['land','wasser','tauchflaeche','klettern','flug','schutz']}
def parse():
 data={}
 for line in HABITAT.strip().splitlines():
  name,land,extra,shelter,other,grade,height,climb,temp,group=line.split('|')
  ff=blanks();ff['land']=fl(land,extra)
  for t in ([] if other=='-' else other.split(';')):
   k,v=t.split(':');a,b=v.split(',');ff[{'aquatic':'wasser','deep':'tauchflaeche','climbable':'klettern'}[k]]=fl(a,b)
  if shelter!='-':ff['schutz']=fl(shelter,shelter) # Ersatz später: exakt pro Tier, nicht Grundfläche+Zuschlag
  data[normal(name)]={'art':'landgehege','gruppe':pair(group),'flaechen':ff,
   'temperaturC':pair(temp),'barriere':{'stufe':int(grade),'hoeheMeter':number(height),'klettersicher':climb=='yes'},
   'schutzProTier':None if shelter=='-' else number(shelter)}
 for line in AVIARY.strip().splitlines():
  name,land,extra,flight,fextra,shelter,grade,height,temp,group=line.split('|')
  ff=blanks();ff['land']=fl(land,extra);ff['flug']=fl(flight,fextra);ff['schutz']=fl(shelter,shelter)
  # Aquatische Grundflächen für diese Vögel stehen in einer zweiten PZ2-Tabelle;
  # Zusatz pro weiterem Vogel ist dort NICHT angegeben und bleibt unbekannt.
  if name=='Eurasian Bittern': ff['wasser']={'basis':25,'jeWeiteresTier':None,'jeJungtier':None}
  if name=='Greater Flamingo': ff['wasser']={'basis':80,'jeWeiteresTier':None,'jeJungtier':None}
  data[normal(name)]={'art':'fluggehege','gruppe':pair(group),'flaechen':ff,'temperaturC':pair(temp),
   'barriere':{'stufe':int(grade),'hoeheMeter':number(height),'klettersicher':None},'schutzProTier':number(shelter)}
 for line in AQUARIUM.strip().splitlines():
  name,deep,extra,salinity,temp,group=line.split('|');ff=blanks();ff['tauchflaeche']=fl(deep,extra)
  data[normal(name)]={'art':'aquarium','gruppe':pair(group),'flaechen':ff,'temperaturC':pair(temp),
   'salinitaet':[s.strip() for s in salinity.split(',')]}
 for line in EXHIBIT.strip().splitlines():
  name,temp,hum,group=line.split('|');data[normal(name)]={'art':'vivarium','gruppe':pair(group),
   'flaechen':blanks(),'temperaturC':pair(temp),'luftfeuchteProzent':pair(hum)}
 return data

def main():
 catalog=parse(); print('Externe Datensätze:',len(catalog))
 files=sorted((ROOT/'assets/daten/lebewesen/tiere').glob('**/*.json'))
 files=[p for p in files if p.parent.name==p.stem]
 matched=[];missing=[];names=set()
 for p in files:
  d=json.loads(p.read_text(encoding='utf-8'))
  namesobj=d.get('identitaet',{}).get('namen',{}) if isinstance(d.get('identitaet'),dict) else {}
  en=namesobj.get('en','') if isinstance(namesobj,dict) else ''
  candidate=BY_ID.get(d.get('id')) or en or ''
  key=normal(candidate)
  # kompakte Schreibvarianten, z.B. Afrikan Savanna, Englisch-Namensfehler
  alias=normal(ALIASES.get(' '.join(re.sub(r'[^a-z0-9 ]','',candidate.lower()).split()),candidate))
  key=key if key in catalog else alias
  if key not in catalog:
   missing.append((d.get('id'),candidate));continue
  verified=catalog[key];names.add(key)
  previous=d.get('planetZoo2',{}).get('rechner') or {}
  updated={**previous,**verified,'fortbewegung':dict(previous.get('fortbewegung') or {}),
   'besucherBetretbar':previous.get('besucherBetretbar'),
   'sprungHoeheMeter':previous.get('sprungHoeheMeter'),
   'quelle':{'art':'Sekundärübersicht nach PZ2-Zoopedia (nicht unabhängig pro Art geprüft)',
             'url':SOURCE,'stand':'2026-10-14'}}
  if verified['art']=='fluggehege':updated['fortbewegung']['fliegen']=True
  if verified['art']=='aquarium':updated['fortbewegung'].update({'schwimmen':True,'tauchen':True})
  d.setdefault('planetZoo2',{})['rechner']=updated
  # Nur das Rechner-Objekt ersetzen, nicht den restlichen Tier-JSON-Code neu formatieren.
  raw=p.read_text(encoding='utf-8')
  marker=raw.find('"planetZoo2"')
  found=re.search(r'"rechner"\s*:\s*',raw[marker:])
  if marker<0 or not found: raise RuntimeError(f'Kein planetZoo2.rechner: {p}')
  start=marker+found.end()
  _,end=json.JSONDecoder().raw_decode(raw[start:])
  replacement=json.dumps(updated,ensure_ascii=False,indent=2).replace('\n','\n    ')
  p.write_text(raw[:start]+replacement+raw[start+end:],encoding='utf-8')
  matched.append((d.get('id'),candidate,verified['art']))
 print('Zuordnung:',len(matched),'von',len(files),'Tier-JSON-Dateien')
 print('Nicht zugeordnet:',missing)
 print('Nicht im Projekt:',[k for k in catalog if k not in names])
 report=ROOT/'anleitungen/GEHEGERECHNER-DATENPRUEFUNG.md'
 report.write_text('# Gehegerechner – Datenabgleich 16.10.2026\n\n'
  f'Quelle (unabhängige Fanseite, Stand 14.10.2026): {SOURCE}\n\n'
  '**Wichtig:** Dies ist ein tabellarischer Sekundärquellen-Abgleich, **keine Einzelprüfung aller offiziellen Frontier-Seiten**. '
  'Barrieren sind Mindestwerte aus der Quelle, keine geprüften Lösungen für beliebige Zonen-/Besuchertrennungen. '
  'Zoopedia-Flächentypen können sich räumlich überlagern, daher Flächen nicht addieren.\n\n'
  'Zweitquelle für zusätzliche Wassergrabenoptionen und einzelne Vogel-Wasserflächen: https://zooanimallist.com/habitat-requirements/\n\n'
  f'Abgeglichen: **{len(matched)} / {len(files)}** lokale Arten. Nicht erfasst: **{len(missing)}**.\n\n'
  '## Noch offen\n\n'+ ('\n'.join(f'- {id}: {name}' for id,name in missing) or 'Keine')+'\n\n'
  '## Geprüfte Zuordnungen\n\n| ID | Name | Typ |\n|---|---|---|\n'+
  '\n'.join(f'| {id} | {name} | {typ} |' for id,name,typ in matched)+'\n\n'
  'Die Angaben zur Gruppen-Grösse sind Zoopedia-Empfehlungen, keine biologischen Grenzen für Männchen und Weibchen. '
  'Unbekannt bleiben insbesondere Sex-Ratios, Besucherfreigaben, Springdistanzen, juvenile Gruppengrenzen und verbindliche Hindernisplanung.\n',encoding='utf-8')
if __name__=='__main__': main()
