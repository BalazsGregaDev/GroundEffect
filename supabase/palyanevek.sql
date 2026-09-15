with f1 (slug, circuit, country) as (values
  ('australian-grand-prix', 'Albert Park Circuit', 'Ausztrália'),
  ('chinese-grand-prix', 'Shanghai International Circuit', 'Kína'),
  ('japanese-grand-prix', 'Suzuka International Racing Course', 'Japán'),
  ('miami-grand-prix', 'Miami International Autodrome', 'Egyesült Államok'),
  ('canadian-grand-prix', 'Circuit Gilles Villeneuve', 'Kanada'),
  ('monaco-grand-prix', 'Circuit de Monaco', 'Monaco'),
  ('barcelona-catalunya-grand-prix', 'Circuit de Barcelona-Catalunya', 'Spanyolország'),
  ('austrian-grand-prix', 'Red Bull Ring', 'Ausztria'),
  ('british-grand-prix', 'Silverstone Circuit', 'Egyesült Királyság'),
  ('belgian-grand-prix', 'Circuit de Spa-Francorchamps', 'Belgium'),
  ('hungarian-grand-prix', 'Hungaroring', 'Magyarország'),
  ('dutch-grand-prix', 'Circuit Zandvoort', 'Hollandia'),
  ('italian-grand-prix', 'Autodromo Nazionale Monza', 'Olaszország'),
  ('spanish-grand-prix', 'Madring', 'Spanyolország'),
  ('azerbaijan-grand-prix', 'Baku City Circuit', 'Azerbajdzsán'),
  ('bahrain-malaysia-grand-prix', 'Sepang International Circuit', 'Malajzia'),
  ('singapore-grand-prix', 'Marina Bay Street Circuit', 'Szingapúr'),
  ('us-grand-prix', 'Circuit of the Americas', 'Egyesült Államok'),
  ('mexican-grand-prix', 'Autódromo Hermanos Rodríguez', 'Mexikó'),
  ('brazilian-grand-prix', 'Autódromo José Carlos Pace', 'Brazília'),
  ('las-vegas-grand-prix', 'Las Vegas Strip Circuit', 'Egyesült Államok'),
  ('qatar-grand-prix', 'Lusail International Circuit', 'Katar'),
  ('abu-dhabi-grand-prix', 'Yas Marina Circuit', 'Egyesült Arab Emírségek')
)
update races r
set circuit = coalesce(r.circuit, f1.circuit),
    country = coalesce(r.country, f1.country)
from f1, race_series s
where s.id = r.series_id and s.slug = 'f1' and r.slug = f1.slug;

with indycar (slug, circuit, location, country) as (values
  ('firestone-grand-prix-of-st-petersburg', 'Streets of St. Petersburg', 'St. Petersburg, Florida', 'Egyesült Államok'),
  ('good-ranchers-250', 'Phoenix Raceway', 'Avondale, Arizona', 'Egyesült Államok'),
  ('java-house-grand-prix-of-arlington', 'Streets of Arlington', 'Arlington, Texas', 'Egyesült Államok'),
  ('childrens-of-alabama-indy-grand-prix', 'Barber Motorsports Park', 'Birmingham, Alabama', 'Egyesült Államok'),
  ('acura-grand-prix-of-long-beach', 'Streets of Long Beach', 'Long Beach, Kalifornia', 'Egyesült Államok'),
  ('sonsio-grand-prix', 'Indianapolis Motor Speedway Road Course', 'Speedway, Indiana', 'Egyesült Államok'),
  ('110th-running-of-the-indianapolis-500', 'Indianapolis Motor Speedway', 'Speedway, Indiana', 'Egyesült Államok'),
  ('chevrolet-detroit-grand-prix', 'Streets of Detroit', 'Detroit, Michigan', 'Egyesült Államok'),
  ('bommarito-automotive-group-500', 'World Wide Technology Raceway', 'Madison, Illinois', 'Egyesült Államok'),
  ('xpel-grand-prix-at-road-america', 'Road America', 'Elkhart Lake, Wisconsin', 'Egyesült Államok'),
  ('honda-indy-200-at-midohio', 'Mid-Ohio Sports Car Course', 'Lexington, Ohio', 'Egyesült Államok'),
  ('borchetta-bourbon-music-city-grand-prix', 'Nashville Superspeedway', 'Lebanon, Tennessee', 'Egyesült Államok'),
  ('onlybulls-grand-prix-of-portland', 'Portland International Raceway', 'Portland, Oregon', 'Egyesült Államok'),
  ('ontario-honda-dealers-indy-at-markham', 'Streets of Markham', 'Markham, Ontario', 'Kanada'),
  ('freedom-250-grand-prix-of-washington-dc', 'Streets of Washington', 'Washington, D.C.', 'Egyesült Államok'),
  ('snapon-makers-and-fixers-250', 'Milwaukee Mile', 'West Allis, Wisconsin', 'Egyesült Államok'),
  ('snapon-milwaukee-mile-250', 'Milwaukee Mile', 'West Allis, Wisconsin', 'Egyesült Államok'),
  ('indycar-grand-prix-of-monterey', 'WeatherTech Raceway Laguna Seca', 'Monterey, Kalifornia', 'Egyesült Államok')
)
update races r
set circuit = coalesce(r.circuit, indycar.circuit),
    location = coalesce(r.location, indycar.location),
    country = coalesce(r.country, indycar.country)
from indycar, race_series s
where s.id = r.series_id and s.slug = 'indycar' and r.slug = indycar.slug;

select s.name as sorozat,
       count(*) filter (where r.circuit is not null) as van_palya,
       count(*) filter (where r.location is not null) as van_helyszin,
       count(*) as futam
from races r
join race_series s on s.id = r.series_id
group by s.name, s.sort_order
order by s.sort_order;
