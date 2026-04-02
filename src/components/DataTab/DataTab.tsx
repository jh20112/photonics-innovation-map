import { SourceBreakdown } from './SourceBreakdown';
import { SourceVenn } from './SourceVenn';
import { DataCompleteness } from './DataCompleteness';
import type { Company } from '../../types/api';
import './DataTab.css';

interface Props {
  companies: Company[] | null;
  onFilterSources: (sources: string[]) => void;
}

export function DataTab({ companies, onFilterSources }: Props) {
  if (!companies) {
    return <div className="data-tab"><div className="data-empty">Loading company data...</div></div>;
  }

  return (
    <div className="data-tab">
      <div className="data-header">
        <h2>Data Overview</h2>
        <p>Transparency into the sources, coverage, and quality of the photonics company dataset.</p>
      </div>
      <SourceVenn companies={companies} onFilterSources={onFilterSources} />
      <div className="data-grid">
        <SourceBreakdown companies={companies} />
        <DataCompleteness companies={companies} />
      </div>
    </div>
  );
}
