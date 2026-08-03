import type { CancerType } from './types';

export const CANCERS: CancerType[] = [
  {
    slug: 'lung',
    label: 'Lung Cancer',
    descriptor: 'Including NSCLC and SCLC',
    ctgovCond: 'lung cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory OR "second line" OR "third line"',
    image: '/cancer-lung.png',
  },
  {
    slug: 'breast',
    label: 'Breast Cancer',
    descriptor: 'All subtypes, incl. HR+, HER2+, TNBC',
    ctgovCond: 'breast cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory OR "later line"',
    image: '/cancer-breast.png',
  },
  {
    slug: 'colorectal',
    label: 'Colorectal Cancer',
    descriptor: 'Colon and rectal cancer',
    ctgovCond: 'colorectal cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory OR "third line"',
    image: '/cancer-colorectal.png',
  },
  {
    slug: 'liver',
    label: 'Liver Cancer',
    descriptor: 'Incl. hepatocellular carcinoma (HCC)',
    ctgovCond: 'hepatocellular carcinoma OR liver cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory',
    image: '/cancer-liver.png',
  },
  {
    slug: 'gastric',
    label: 'Gastric Cancer',
    descriptor: 'Stomach and gastroesophageal junction',
    ctgovCond: 'gastric cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory',
    image: '/cancer-gastric.png',
  },
  {
    slug: 'pancreatic',
    label: 'Pancreatic Cancer',
    descriptor: 'Incl. pancreatic ductal adenocarcinoma',
    ctgovCond: 'pancreatic cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory',
    image: '/cancer-pancreatic.png',
  },
  {
    slug: 'prostate',
    label: 'Prostate Cancer',
    descriptor: 'Incl. castration-resistant disease',
    ctgovCond: 'prostate cancer',
    afterCareTerms: 'advanced OR metastatic OR castration-resistant',
    image: '/cancer-prostate.png',
  },
  {
    slug: 'ovarian',
    label: 'Ovarian Cancer',
    descriptor: 'Incl. platinum-resistant disease',
    ctgovCond: 'ovarian cancer',
    afterCareTerms: 'advanced OR recurrent OR platinum-resistant',
    image: '/cancer-ovarian.png',
  },
  {
    slug: 'esophageal',
    label: 'Esophageal Cancer',
    descriptor: 'Squamous cell and adenocarcinoma',
    ctgovCond: 'esophageal cancer',
    afterCareTerms: 'advanced OR metastatic OR refractory',
    image: '/cancer-esophageal.png',
  },
  {
    slug: 'lymphoma',
    label: 'Lymphoma',
    descriptor: 'Hodgkin and non-Hodgkin lymphoma',
    ctgovCond: 'lymphoma',
    afterCareTerms: 'relapsed OR refractory',
    image: '/cancer-lymphoma.png',
  },
  {
    slug: 'leukemia',
    label: 'Leukemia',
    descriptor: 'Including acute and chronic leukemias',
    ctgovCond: 'leukemia',
    afterCareTerms:
      'refractory OR relapsed OR "second line" OR "salvage"',
    image: '/cancer-leukemia.png',
  },
];

export function getCancer(slug: string): CancerType | undefined {
  return CANCERS.find((c) => c.slug === slug);
}
