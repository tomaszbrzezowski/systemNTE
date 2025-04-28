import React from 'react';

interface SeasonSelectorProps {
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  selectedSeason,
  onSeasonChange
}) => {
  // Generate seasons list (current season +/- 2 years)
  const generateSeasons = () => {
    const currentYear = new Date().getFullYear();
    const seasons: string[] = [];
    
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      seasons.push(`${year}/${year + 1}`);
    }
    
    return seasons;
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="text-white text-sm font-medium">Sezon:</label>
      <select
        value={selectedSeason}
        onChange={(e) => onSeasonChange(e.target.value)}
        className="bg-black/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-white/40 focus:border-transparent hover:bg-white/10 transition-colors"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      >
        {generateSeasons().map(season => (
          <option key={season} value={season} className="text-white bg-black/70">
            Sezon {season}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SeasonSelector;