import { SourceBreakdown } from './SourceBreakdown';
import { SourceVenn } from './SourceVenn';
import { DataCompleteness } from './DataCompleteness';
import type { Company } from '../../types/api';
import './DataTab.css';

interface Props {
  companies: Company[] | null;
  onSelectCompany?: (company: Company) => void;
}

export function DataTab({ companies, onSelectCompany }: Props) {
  if (!companies) {
    return <div className="data-tab"><div className="data-empty">Loading company data...</div></div>;
  }

  return (
    <div className="data-tab">
      <div className="data-header">
        <h2>Data Overview</h2>
        <p>Transparency into the sources, coverage, and quality of the photonics company dataset.</p>
      </div>
      <SourceVenn companies={companies} onSelectCompany={onSelectCompany} />
      <div className="data-grid">
        <SourceBreakdown companies={companies} />
        <DataCompleteness companies={companies} />
      </div>
    </div>
  );
}
