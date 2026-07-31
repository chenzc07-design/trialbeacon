import type { SourceMeta, SourceId } from './types';

export const SOURCES: Record<SourceId, SourceMeta> = {
  ctgov: {
    id: 'ctgov',
    label: 'ClinicalTrials.gov',
    fullName: 'ClinicalTrials.gov — U.S. National Library of Medicine',
    region: 'US',
    url: 'https://clinicaltrials.gov/',
    kind: 'registry',
  },
  fda: {
    id: 'fda',
    label: 'FDA',
    fullName: 'U.S. Food and Drug Administration',
    region: 'US',
    url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/oncology-cancer-hematologic-malignancies-approval-notifications',
    kind: 'regulator',
  },
  nccn: {
    id: 'nccn',
    label: 'NCCN',
    fullName: 'National Comprehensive Cancer Network (public pages)',
    region: 'US',
    url: 'https://www.nccn.org/guidelines/category_1',
    kind: 'guidelines',
  },
  ema: {
    id: 'ema',
    label: 'EMA',
    fullName: 'European Medicines Agency',
    region: 'EU',
    url: 'https://www.ema.europa.eu/en/medicines',
    kind: 'regulator',
  },
  ctis: {
    id: 'ctis',
    label: 'CTIS',
    fullName: 'EU Clinical Trials Information System',
    region: 'EU',
    url: 'https://euclinicaltrials.eu/ctis-public/search',
    kind: 'registry',
  },
  esmo: {
    id: 'esmo',
    label: 'ESMO',
    fullName: 'European Society for Medical Oncology (public pages)',
    region: 'EU',
    url: 'https://www.esmo.org/guidelines',
    kind: 'guidelines',
  },
  cde: {
    id: 'cde',
    label: 'CDE',
    fullName: 'Center for Drug Evaluation, NMPA (国家药品监督管理局药品审评中心)',
    region: 'CN',
    url: 'https://www.cde.org.cn/',
    kind: 'regulator',
  },
  nmpa: {
    id: 'nmpa',
    label: 'NMPA',
    fullName: 'National Medical Products Administration (国家药品监督管理局)',
    region: 'CN',
    url: 'https://www.nmpa.gov.cn/',
    kind: 'regulator',
  },
  chictr: {
    id: 'chictr',
    label: 'ChiCTR',
    fullName: 'Chinese Clinical Trial Registry (中国临床试验注册中心)',
    region: 'CN',
    url: 'https://www.chictr.org.cn/',
    kind: 'registry',
  },
};

export const REGION_LABEL: Record<'US' | 'EU' | 'CN', string> = {
  US: 'United States',
  EU: 'Europe',
  CN: 'China',
};

export const REGION_SHORT: Record<'US' | 'EU' | 'CN', string> = {
  US: 'US',
  EU: 'EU',
  CN: 'CN',
};

export const TYPE_LABEL: Record<string, string> = {
  trial: 'Clinical trial',
  regulatory: 'Regulatory',
  guideline: 'Guideline',
  registry: 'Registry',
};
