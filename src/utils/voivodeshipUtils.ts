export const getVoivodeshipAbbreviation = (voivodeship: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Dolnośląskie': 'DLŚ',
    'Kujawsko-pomorskie': 'KUJ',
    'Lubelskie': 'LUB',
    'Lubuskie': 'LBS',
    'Łódzkie': 'ŁDZ',
    'Małopolskie': 'MŁP',
    'Mazowieckie': 'MAZ',
    'Opolskie': 'OPL',
    'Podkarpackie': 'PKR',
    'Podlaskie': 'PDL',
    'Pomorskie': 'POM',
    'Śląskie': 'ŚLK',
    'Świętokrzyskie': 'ŚWK',
    'Warmińsko-mazurskie': 'WMZ',
    'Wielkopolskie': 'WLP',
    'Zachodniopomorskie': 'ZPM'
  };

  return abbreviations[voivodeship] || voivodeship.substring(0, 3).toUpperCase();
};