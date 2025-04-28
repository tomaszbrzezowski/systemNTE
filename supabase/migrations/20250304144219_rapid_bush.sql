/*
  # Add coordinates for Polish cities

  1. Changes
    - Updates coordinates for all existing cities in the database
    - Sets default coordinates for any cities without specific coordinates
    - Ensures all cities have valid latitude/longitude values

  2. Coordinates
    - Uses precise GPS coordinates for major Polish cities
    - Default coordinates (for unknown cities) set to Poland's center:
      - Latitude: 52.0692°N
      - Longitude: 19.4803°E
*/

-- Update coordinates for all cities
UPDATE cities SET 
  latitude = COALESCE(
    CASE name
      WHEN 'Warszawa' THEN 52.2297
      WHEN 'Kraków' THEN 50.0647
      WHEN 'Łódź' THEN 51.7592
      WHEN 'Wrocław' THEN 51.1079
      WHEN 'Poznań' THEN 52.4064
      WHEN 'Gdańsk' THEN 54.3520
      WHEN 'Szczecin' THEN 53.4285
      WHEN 'Bydgoszcz' THEN 53.1235
      WHEN 'Lublin' THEN 51.2465
      WHEN 'Białystok' THEN 53.1325
      WHEN 'Katowice' THEN 50.2649
      WHEN 'Gdynia' THEN 54.5189
      WHEN 'Częstochowa' THEN 50.8118
      WHEN 'Radom' THEN 51.4027
      WHEN 'Rzeszów' THEN 50.0412
      WHEN 'Toruń' THEN 53.0138
      WHEN 'Kielce' THEN 50.8661
      WHEN 'Gliwice' THEN 50.2945
      WHEN 'Zabrze' THEN 50.3249
      WHEN 'Olsztyn' THEN 53.7784
      WHEN 'Bielsko-Biała' THEN 49.8224
      WHEN 'Bytom' THEN 50.3483
      WHEN 'Zielona Góra' THEN 51.9356
      WHEN 'Rybnik' THEN 50.1022
      WHEN 'Ruda Śląska' THEN 50.2558
      WHEN 'Opole' THEN 50.6683
      WHEN 'Tychy' THEN 50.1307
      WHEN 'Gorzów Wielkopolski' THEN 52.7325
      WHEN 'Płock' THEN 52.5468
      WHEN 'Dąbrowa Górnicza' THEN 50.3217
      WHEN 'Wałbrzych' THEN 50.7845
      WHEN 'Tarnów' THEN 50.0121
      WHEN 'Chorzów' THEN 50.2974
      WHEN 'Koszalin' THEN 54.1943
      WHEN 'Kalisz' THEN 51.7577
      WHEN 'Legnica' THEN 51.2070
      WHEN 'Grudziądz' THEN 53.4837
      WHEN 'Słupsk' THEN 54.4641
      WHEN 'Jaworzno' THEN 50.2028
      WHEN 'Jastrzębie-Zdrój' THEN 49.9495
      WHEN 'Zamość' THEN 50.7230
      WHEN 'Chełm' THEN 51.1429
      WHEN 'Piotrków Trybunalski' THEN 51.4047
      WHEN 'Sieradz' THEN 51.5965
      WHEN 'Nowy Sącz' THEN 49.6174
      WHEN 'Siedlce' THEN 52.1676
      WHEN 'Nysa' THEN 50.4824
      WHEN 'Przemyśl' THEN 49.7838
      WHEN 'Krosno' THEN 49.6889
      WHEN 'Łomża' THEN 53.1781
      WHEN 'Suwałki' THEN 54.1115
      WHEN 'Ostrowiec Świętokrzyski' THEN 50.9295
      WHEN 'Elbląg' THEN 54.1522
      WHEN 'Konin' THEN 52.2230
      WHEN 'Świnoujście' THEN 53.9100
    END,
    latitude  -- Keep existing value if not in the list
  ),
  longitude = COALESCE(
    CASE name
      WHEN 'Warszawa' THEN 21.0122
      WHEN 'Kraków' THEN 19.9450
      WHEN 'Łódź' THEN 19.4559
      WHEN 'Wrocław' THEN 17.0385
      WHEN 'Poznań' THEN 16.9252
      WHEN 'Gdańsk' THEN 18.6466
      WHEN 'Szczecin' THEN 14.5528
      WHEN 'Bydgoszcz' THEN 18.0084
      WHEN 'Lublin' THEN 22.5684
      WHEN 'Białystok' THEN 23.1688
      WHEN 'Katowice' THEN 19.0238
      WHEN 'Gdynia' THEN 18.5305
      WHEN 'Częstochowa' THEN 19.1203
      WHEN 'Radom' THEN 21.1471
      WHEN 'Rzeszów' THEN 21.9991
      WHEN 'Toruń' THEN 18.5981
      WHEN 'Kielce' THEN 20.6286
      WHEN 'Gliwice' THEN 18.6714
      WHEN 'Zabrze' THEN 18.7857
      WHEN 'Olsztyn' THEN 20.4801
      WHEN 'Bielsko-Biała' THEN 19.0584
      WHEN 'Bytom' THEN 18.9157
      WHEN 'Zielona Góra' THEN 15.5062
      WHEN 'Rybnik' THEN 18.5463
      WHEN 'Ruda Śląska' THEN 18.8555
      WHEN 'Opole' THEN 17.9231
      WHEN 'Tychy' THEN 18.9641
      WHEN 'Gorzów Wielkopolski' THEN 15.2369
      WHEN 'Płock' THEN 19.7064
      WHEN 'Dąbrowa Górnicza' THEN 19.1795
      WHEN 'Wałbrzych' THEN 16.2845
      WHEN 'Tarnów' THEN 20.9858
      WHEN 'Chorzów' THEN 18.9545
      WHEN 'Koszalin' THEN 16.1721
      WHEN 'Kalisz' THEN 18.0931
      WHEN 'Legnica' THEN 16.1619
      WHEN 'Grudziądz' THEN 18.7536
      WHEN 'Słupsk' THEN 17.0287
      WHEN 'Jaworzno' THEN 19.2738
      WHEN 'Jastrzębie-Zdrój' THEN 18.5714
      WHEN 'Zamość' THEN 23.2519
      WHEN 'Chełm' THEN 23.4716
      WHEN 'Piotrków Trybunalski' THEN 19.6775
      WHEN 'Sieradz' THEN 18.7306
      WHEN 'Nowy Sącz' THEN 20.7153
      WHEN 'Siedlce' THEN 22.2707
      WHEN 'Nysa' THEN 17.3327
      WHEN 'Przemyśl' THEN 22.7677
      WHEN 'Krosno' THEN 21.7658
      WHEN 'Łomża' THEN 22.0595
      WHEN 'Suwałki' THEN 22.9307
      WHEN 'Ostrowiec Świętokrzyski' THEN 21.3854
      WHEN 'Elbląg' THEN 19.4044
      WHEN 'Konin' THEN 18.2514
      WHEN 'Świnoujście' THEN 14.2475
    END,
    longitude  -- Keep existing value if not in the list
  );

-- Set default coordinates for any remaining cities without coordinates
UPDATE cities SET
  latitude = COALESCE(latitude, 52.0692),   -- Poland's center latitude
  longitude = COALESCE(longitude, 19.4803)  -- Poland's center longitude
WHERE latitude IS NULL OR longitude IS NULL;