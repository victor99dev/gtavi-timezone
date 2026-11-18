"""Optional: regenerate the included Natural Earth world SVG; requires geopandas."""
from pathlib import Path
import geopandas as gpd
from shapely.geometry import Polygon,MultiPolygon

source='/opt/pyvenv/lib/python3.13/site-packages/pyogrio/tests/fixtures/naturalearth_lowres/naturalearth_lowres.shp'
gdf=gpd.read_file(source)
W,H=1200,548
X=lambda lon: (lon+180)/360*W
Y=lambda lat: (86-lat)/172*H
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Mapa mundi estilizado">',
'<defs><linearGradient id="land" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#193c65"/><stop offset="1" stop-color="#18284d"/></linearGradient></defs>']
for lon in range(-180,181,30):
 out.append(f'<path d="M {X(lon):.1f} 0 V {H}" stroke="#263a62" stroke-width=".8" opacity=".48"/>')
for lat in range(-60,91,30):
 out.append(f'<path d="M 0 {Y(lat):.1f} H {W}" stroke="#263a62" stroke-width=".8" opacity=".48"/>')
for geom in gdf.geometry:
 if geom is None: continue
 ps=geom.geoms if isinstance(geom,MultiPolygon) else [geom]
 for poly in ps:
  if not isinstance(poly,Polygon):continue
  poly=poly.simplify(.22,preserve_topology=True)
  coords=list(poly.exterior.coords)
  if len(coords)<3:continue
  path=' '.join((('M' if i==0 else 'L')+f'{X(x):.2f},{Y(y):.2f}') for i,(x,y) in enumerate(coords))+' Z'
  out.append(f'<path d="{path}" fill="url(#land)" stroke="#426da1" stroke-width="1.15" opacity=".94"/>')
out.append('</svg>')
p=Path(__file__).resolve().parents[1]/'assets/world.svg'
p.write_text(''.join(out),encoding='utf-8')
print(p,p.stat().st_size)
