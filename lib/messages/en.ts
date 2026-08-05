// English — source of truth for the TrialBeacon message catalogue.
// Every other locale (zh, fr, de, ja, ko) mirrors this exact shape.
// Strings may contain {placeholders}; {n|one|many} selects by count.

export const en = {
  nav: {
    cancerTypes: 'Cancer types',
    afterCare: 'After Care',
    changeTracker: 'Change Tracker',
    sources: 'Sources',
    alerts: 'Alerts',
    getWeekly: 'Get weekly updates',
    toggleMenu: 'Toggle navigation menu',
    myList: 'My list',
    safety: 'Before you contact a study',
    signIn: 'Sign in',
    signOut: 'Sign out',
    account: 'Account',
  },
  common: {
    noMedicalAdvice: 'No medical advice',
    noRecommendations: 'No treatment recommendations',
    freeToUse: 'Free to use',
    viewAllTypes: 'View all types',
    openView: 'Open this view',
    allTypes: 'All types',
    allRegions: 'All regions',
    searchAria: 'Search official records',
    searchPlaceholder: 'Search by keyword, NCT number, phase…',
    searchButton: 'Search',
    viewOriginal: 'View original',
    noRecordsMatch: 'No records match this view',
    openRegistries: 'Try a different filter, or open the official registries directly from the Sources page.',
    continuouslyUpdated: 'Continuously updated',
    readFullDisclaimer: 'Read the full disclaimer',
    recordsIndexed: '{n} records indexed',
    advancedLaterLine: '{n} advanced / later-line',
    details: 'Details',
    back: 'Back',
    lastVerified: 'Last verified {date}',
    stale7d: 'Verification is more than 7 days old',
    sortBy: 'Sort by',
    sortRecent: 'Most recent',
    sortTitle: 'Title (A–Z)',
    sortPhase: 'Phase',
  },
  home: {
    eyebrow: 'Independent · Neutral · Traceable',
    metaTitle: 'TrialBeacon — official public records for advanced and later-line cancer care',
    metaDescription: 'Publicly listed clinical trial registrations, guideline indexes and regulatory notices from official sources in the United States, Europe and China, including records for advanced, metastatic, relapsed, later-line and supportive / palliative care. Every entry links to the original page. No recommendations, no ranking, no interpretation.',
    // Desktop long title (hidden on small screens via CSS).
    title1: 'Told to consider conservative or palliative care and still want to see the official public record yourself.',
    // Mobile short title.
    title1Short: 'Told to consider conservative care and still want to see the official record yourself.',
    title2: '',
    subtitle:
      'TrialBeacon does one thing: it gathers publicly listed clinical-trial registrations, guideline indexes and regulatory notices from the United States, Europe and China that relate to advanced / recurrent / later-line / supportive care, and provides direct links to the original sources. No recommendations, no ranking, no interpretation.',
    subtitleShort:
      'It simply gathers publicly listed advanced / recurrent / later-line official records from the US, Europe and China, and provides links to the originals. No recommendations, no interpretation.',
    // Rendered as its own line under the subtitle, both desktop and mobile.
    subtitleNo: '',
    // Hero primary action. Long label on desktop, short label on mobile.
    heroCta: 'Open the After Conservative / Palliative Care view',
    heroCtaShort: 'Open After Care view',
    heroCtaSecondary: 'Or browse all records by cancer type',
    badgeVerbatim: 'Verbatim from the source',
    badgeRegions: 'US · Europe · China official records',
    afterCareTitle: 'After Conservative / Palliative Care',
    afterCareKicker: 'Dedicated view',
    afterCareBody:
      'This view only includes public records whose official title or scope explicitly mention advanced, metastatic, recurrent, refractory, later-line treatment, or supportive / palliative care. It is not advice, and it does not filter for "what fits you" — it simply gathers the literally relevant official entries in one place so you can check the originals yourself.',
    afterCareNotRec: '',
    afterCareCta: 'Open this view',
    afterCareFoot:
      'Whether a record is still open, current, or appropriate for any individual can only be confirmed by the official source and your treating doctor.',
    cancerListTitle: 'Browse by cancer type',
    cancerListSub:
      'If you want to see all publicly listed records for a specific cancer type (any stage), enter here.',
    cancerListCta: 'Or browse all records by cancer type',
    browseAllTypes: 'Browse all cancer types',
    principlesTitle: 'How this site works',
    principles: {
      official: {
        title: 'Official sources only',
        body: 'Every entry links directly to ClinicalTrials.gov, FDA, NCCN, EMA, CTIS, ESMO, CDE, NMPA or ChiCTR. Nothing is written by us.',
      },
      noRec: {
        title: 'No recommendations',
        body: 'We never rank, evaluate or suggest treatments. Titles are reproduced verbatim from the official record.',
      },
      threeRegions: {
        title: 'Three regions, side by side',
        body: 'The United States, Europe and China are shown side by side, so you can view directly what each official system lists.',
      },
      traceable: {
        title: 'Traceable, always',
        body: 'Every card has one job: take you to the original official page in one click, so you can verify everything yourself.',
      },
    },
    sourcesTitle: 'Every record traces back to one of these official sources',
    sourcesSub: 'Snapshot verified on {date}. Read how records are collected on the Sources page.',
    sourcesCta: 'Sources & methodology',
    freshnessTitle: 'Data freshness',
    freshnessBody: 'Records are retrieved live from the public APIs where possible, or from the last verified snapshot.',
  },
  cancersIndex: {
    eyebrow: 'Browse',
    title: 'Cancer types',
    subtitle:
      'Each page aggregates publicly listed records for one cancer type — clinical trial registrations, guideline indexes and regulatory notices — from official sources in the United States, Europe and China. Every entry links to the original page.',
  },
  cancerDetail: {
    advancedViewCta: 'Advanced / later-line view',
    indexed: '{n} official records currently indexed across three regions.',
  },
  afterCare: {
    eyebrow: 'Dedicated view',
    title: 'After Conservative / Palliative Care',
    introDesktop:
      'This view includes only public records whose official title or study scope explicitly states advanced, metastatic, recurrent, refractory, later-line, supportive care, or palliative. TrialBeacon makes no screening judgment, matching, or recommendation — it simply gathers the literally relevant official entries together and provides direct links to the originals. Whether a record is still open, or relevant to any individual situation, should be determined from the official original and your physician’s judgment.',
    introMobile:
      'Includes only public records whose official title explicitly mentions advanced / recurrent / later-line / supportive care. No recommendations, no matching — only links to the originals. Defer to the official page and your physician’s judgment.',
    pleaseRead: 'Please read this first.',
    pleaseReadBody:
      'A record appearing here does not mean it is open, available or appropriate for any individual. Inclusion is based only on wording in the official record — never on any judgement by this site. Discuss anything you find with your treating doctor.',
    foot:
      'Whether a record is still open, current, or appropriate for any individual can only be confirmed by the official source and your treating doctor.',
    openBtn: 'Open this view',
  },
  auth: {
    title: 'Sign in to TrialBeacon',
    eyebrow: 'Account',
    intro:
      'Signing in only saves your follow list and alert preferences across devices. It does not change any medical judgement on this site, and it does not make any record more or less appropriate for you.',
    emailTab: 'Email',
    googleTab: 'Google',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    codeLabel: '6-digit code',
    codePlaceholder: 'Enter the code we sent',
    sendCode: 'Send code',
    sending: 'Sending…',
    resend: 'Resend code',
    verify: 'Verify and sign in',
    verifying: 'Verifying…',
    codeHint: 'We just sent a 6-digit code to your email. It expires in 10 minutes.',
    codeSent: 'Code sent. Check your inbox (and spam folder).',
    googleBtn: 'Continue with Google',
    signedInAs: 'Signed in as {email}',
    signOutCta: 'Sign out',
    signedInTitle: 'You are signed in',
    signedInBody:
      'Your follow list and weekly alert preferences will sync to this device automatically.',
    errorNetwork: 'Network error. Please try again.',
    errorInvalid: 'That code is incorrect or has expired. Request a new one.',
    errorNoCode: 'Click "Send code" first.',
    errorEmail: 'Please enter a valid email address.',
    errorEmailUnavailable:
      'Email codes cannot be sent right now. Use Continue with Google, or try again later.',
    errorRateLimited: 'Too many attempts. Please wait a few minutes and try again.',
    privacyTitle: 'What is stored',
    privacyBody:
      'Your email address and a one-way hash of it. Your selected cancer types for alerts. Your saved records. Nothing else. You can sign out and erase everything at any time from the account page.',
    dismiss: 'Not now',
  },
  account: {
    title: 'Account',
    emailLabel: 'Email',
    listTitle: 'My follow list',
    listHint:
      'Records you have saved are listed here, synced across devices. Nothing here is a recommendation.',
    alertsTitle: 'Weekly alert preferences',
    alertsHint:
      'Free accounts may follow up to {max} cancer type. You can change this at any time.',
    alertsCount: 'Following {n} of {max} cancer type',
    notSignedIn: 'You are not signed in.',
    signInCta: 'Sign in or create an account',
    signOutCta: 'Sign out',
    saved: 'Synced just now',
    freeLimit: 'Free accounts may follow up to {max} cancer type. Subscribe to follow more.',
    eraseTitle: 'Erase everything',
    eraseHint: 'Deletes your saved records and alert settings from our store and from this browser, then signs you out. This cannot be undone.',
    eraseCta: 'Erase my data',
    eraseConfirmCta: 'Confirm — erase now',
    eraseCancel: 'Cancel',
    erasing: 'Erasing…',
  },
  alerts: {
    eyebrow: 'Free',
    title: 'Weekly Alerts',
    intro:
      'If checking websites is the last thing you want to do right now, let the update come to you. Once a week, we send a single minimal email listing official records newly indexed for the topics you follow — nothing else.',
    whatYouGet: [
      'One plain email per week — no more',
      'Only links to official records, with source and date',
      'One cancer type of your choice on the free plan',
      'US, European and Chinese sources, as you prefer',
      'Unsubscribe with one click, from any email',
    ],
    form: {
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      cancerLegend: 'Cancer types to follow',
      selectedCount: '{n}/{max} selected',
      regionsLegend: 'Regions',
      subscribe: 'Subscribe to weekly updates',
      submitting: 'Saving…',
      savedTitle: 'Subscription saved',
      savedBody:
        'You will receive one plain email per week containing only links to official records for the topics you chose. You can unsubscribe from any email at any time.',
      errorNetwork: 'Network error. Please try again.',
      finePrint:
        'One email per week, links only, no tracking pixels, unsubscribe anytime. Your address is used solely for this alert and is never shared.',
      signInPrompt: 'Sign in to manage alert preferences across devices.',
    },
    freeLimitNote: 'Without an account you can follow up to {max} cancer type. Sign in for the same free limit, sync across devices, and receive future paid-tier extensions.',
  },
  follow: {
    add: 'Add to my follow list',
    remove: 'Remove from my follow list',
    saved: 'In my follow list',
    signInToSave: 'Sign in to save across devices',
  },
  changes: {
    eyebrow: 'What changed',
    title: 'Change Tracker',
    intro:
      'A factual log of movement in the official registries: records that were newly listed, revised, or closed to enrolment within the selected window. Status labels are taken directly from the registry.',
    lastNDays: 'Last {n} days',
    changesSince: '{n} changes since {date}',
    noChangesTitle: 'No recorded changes in this window',
    noChangesBody: 'Try the 14-day window, or browse the full lists by cancer type.',
    groups: {
      new: {
        heading: 'Newly listed',
        sub: 'Records first posted within this window',
      },
      updated: {
        heading: 'Recently updated',
        sub: 'Existing records whose official page was revised',
      },
      closed: {
        heading: 'No longer open',
        sub: 'Records whose status indicates enrolment has ended',
      },
    },
  },
  search: {
    eyebrow: 'Search',
    title: 'Search indexed records',
    intro:
      'Plain keyword search over the titles and identifiers of indexed records. For a complete, always-current search, the official registries remain the reference — every result links there directly.',
    results: '{n|record|records} matching “{query}”',
    quickEntries: 'Quick entries',
  },
  sources: {
    eyebrow: 'Transparency',
    title: 'Sources & methodology',
    intro:
      'Everything on TrialBeacon can be traced to one of the official sources below. This page explains exactly how records are collected and what the site does — and does not — do with them.',
    kind: {
      registry: 'Clinical trial registry',
      regulator: 'Medicines regulator',
      guidelines: 'Clinical guidelines (public pages)',
    },
    methodologyTitle: 'Methodology',
    method: {
      where: {
        title: 'Where records come from',
        body: 'Trial records are retrieved from the ClinicalTrials.gov public API v2. European and Chinese entries are curated links to the official registers and public lists maintained by EMA, CTIS, ESMO, CDE, NMPA and ChiCTR. TrialBeacon does not scrape restricted content and does not host copies of any document.',
      },
      what: {
        title: 'What is shown',
        body: 'For each record: the title as published by the source, the source name, the region, the record type, the phase and status where the registry provides them, and the official date. That is the entire dataset — there is no commentary layer.',
      },
      absent: {
        title: 'What is deliberately absent',
        body: 'No effectiveness claims, no rankings, no matching, no “relevance” scores, no editorial summaries. Wording that evaluates or promotes a treatment does not appear on this site.',
      },
      afterCare: {
        title: 'How the after-care view is built',
        body: 'A record appears in the After Conservative / Palliative Care view only when its own official title or scope refers to advanced, metastatic, recurrent or relapsed disease, later treatment lines, or supportive and palliative care. The filter is lexical and transparent — never a judgement.',
      },
      freshness: {
        title: 'Freshness',
        body: 'Live registry queries are cached for one hour. If the live API is unreachable, the site serves its last verified snapshot (currently {date}) and says so on the page. Links always open the live official record.',
      },
      corrections: {
        title: 'Corrections',
        body: 'If any entry links to the wrong page or misstates a source-provided field, it will be corrected as soon as it is identified. The original registry page is always the authoritative version.',
      },
    },
  },
  about: {
    eyebrow: 'About',
    title: 'What TrialBeacon is — and what it is not',
    p1:
      'When someone is told that conservative or palliative care is the recommended path, many still want to know one simple thing: is there anything new in the public record? Answering that question today means navigating several registries in several languages, surrounded by marketing, interpretation and emotionally loaded content.',
    p2:
      'TrialBeacon exists to remove that burden. It collects links to publicly listed clinical trials, guideline indexes and regulatory notices from official sources in the United States, Europe and China, and presents them in one calm, minimal place. Each entry shows a title, a source, a date and a link to the original page. That is all.',
    isTitle: 'TrialBeacon is',
    is: [
      'A neutral index of publicly available official information',
      'A way to see US, European and Chinese official sources side by side',
      'A log of what changed in official registries recently',
      'A direct route to the original page for every single entry',
    ],
    isNotTitle: 'TrialBeacon is not',
    isNot: [
      'It does not provide medical advice of any kind',
      'It does not recommend, rank or evaluate treatments or trials',
      'It does not match patients to trials',
      'It does not interpret, summarise or editorialise official records',
      'It does not host advertising or sponsored content',
    ],
    principlesTitle: 'Principles',
    neutralityLabel: 'Neutrality.',
    neutralityBody:
      'Titles are reproduced verbatim from official records. Words that evaluate or promote a treatment do not appear on this site — in records or in interface copy.',
    traceabilityLabel: 'Traceability.',
    traceabilityBody:
      'Every entry carries a one-click link to its original official page. If a record cannot be traced, it is not listed.',
    restraintLabel: 'Restraint.',
    restraintBody:
      'The core index is free and will remain free. If optional paid features are added later, they will never include advertising, recommendations or content that plays on emotion. Trust is the only asset this project has.',
    sourcesCta: 'Sources & methodology',
    disclaimerCta: 'Full disclaimer',
  },
  disclaimer: {
    eyebrow: 'Please read',
    title: 'Full disclaimer',
    intro:
      'This page states plainly what TrialBeacon does and the limits of what it can responsibly offer. A short version of this notice appears on every page of the site and in every email.',
    compact:
      'TrialBeacon does not provide medical advice and does not recommend, rank or evaluate any treatment or trial. Please discuss any information you find here with your doctor, and always rely on the original official page.',
    bannerTitle: 'This site does not provide medical advice',
    bannerBody:
      'TrialBeacon only aggregates links to publicly available official information. It does not recommend, rank or evaluate any treatment, trial or medicine, and nothing here implies suitability for any individual. Please discuss anything you find with your treating doctor, and always rely on the original official page — records change over time.',
    sections: {
      noAdvice: {
        heading: 'No medical advice',
        body: 'TrialBeacon is an information index. Nothing on this site — including the presence, ordering, wording or categorisation of any record — constitutes medical advice, a medical opinion, a diagnosis, or a recommendation for or against any treatment, clinical trial, medicine or provider. Decisions about care should always be made together with a qualified medical professional who knows the individual situation.',
      },
      noRelationship: {
        heading: 'No doctor–patient relationship',
        body: 'Using this site does not create any form of professional or care relationship. TrialBeacon has no knowledge of any visitor’s medical circumstances and cannot assess suitability of anything it links to.',
      },
      accuracy: {
        heading: 'Accuracy and completeness',
        body: 'Records are reproduced from official public sources and linked back to those sources. Official records change over time; a page here may lag the original. The original official page is always the authoritative version. TrialBeacon does not guarantee completeness — absence of a record here does not mean it does not exist.',
      },
      eligibility: {
        heading: 'Eligibility and availability',
        body: 'A clinical trial appearing in this index does not mean it is open, appropriate or available to any specific person. Eligibility is defined solely by the official protocol and determined by the trial team. Contact information, when needed, is available on the original registry page.',
      },
      thirdParty: {
        heading: 'Third-party sites',
        body: 'Links lead to websites operated by governments, agencies and organisations that are entirely independent of TrialBeacon. Their content, availability and policies are their own.',
      },
      wellbeing: {
        heading: 'Emotional wellbeing',
        body: 'Reading trial registries during serious illness can be draining. This site is intentionally minimal so that checking it takes minutes, not hours. If the information here raises questions, the most useful next step is a conversation with the treating team — bring links, and ask.',
      },
    },
  },
  unsubscribe: {
    eyebrow: 'Weekly Alerts',
    title: 'Unsubscribe',
    intro:
      'Enter the address you subscribed with and it will be removed from the weekly alert list. There is nothing else to confirm.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    button: 'Unsubscribe',
    submitting: 'Removing…',
    doneTitle: 'Unsubscribed',
    doneMsgRemoved:
      'Your subscription has been removed. You will not receive further emails.',
    doneMsgNone:
      'No active subscription was found for this address. Either way, you will not receive further emails.',
    finePrint:
      'No confirmation step and no questions asked. Your address is removed from the store immediately.',
  },
  notFound: {
    eyebrow: '404',
    title: 'This page does not exist',
    body:
      'The address may have changed. Everything on this site is reachable from the pages below.',
    home: 'Home',
    cancers: 'Cancer types',
    search: 'Search',
  },
  footer: {
    tagline: 'Official public records for advanced and later-line care. Nothing more.',
    desc:
      'A neutral link aggregator for publicly listed clinical trials, guideline indexes and regulatory notices from the United States, Europe and China.',
    browse: 'Browse',
    about: 'About',
    stayInformed: 'Stay informed',
    legal:
      'TrialBeacon is an independent information index. It is not affiliated with, or endorsed by, ClinicalTrials.gov, the FDA, NCCN, EMA, ESMO, CDE, NMPA, ChiCTR or any other organisation referenced on this site. All trademarks belong to their respective owners. Records are reproduced verbatim from official registries; always rely on the original page, which may have changed since it was indexed here.',
  },
  badge: {
    change: {
      new: 'Newly listed',
      updated: 'Record updated',
      closed: 'No longer open',
    },
    type: {
      trial: 'Clinical trial',
      regulatory: 'Regulatory',
      guideline: 'Guideline',
      registry: 'Registry',
    },
  },
  region: {
    US: 'United States',
    EU: 'Europe',
    CN: 'China',
    OTHER: 'Other regions',
    all: 'All regions',
  },
  filters: {
    heading: 'Filter',
    openOnly: 'Open to enrolment only',
    openOnlyHint:
      'Keeps records whose official status is recruiting, not yet recruiting, or enrolling by invitation.',
    phase: 'Phase',
    allPhases: 'All phases',
    afterCareOnly: 'Advanced / later-line records only',
    afterCareOnlyHint:
      'Keeps records whose official text mentions advanced, metastatic, relapsed, refractory, later-line, or supportive / palliative settings.',
    clear: 'Clear filters',
    showing: 'Showing {n} of {total}',
    noMatch: 'No records match these filters.',
    noMatchHint: 'Clear one filter to widen the view.',
  },
  trial: {
    breadcrumb: 'Record',
    officialRecordTitle: 'Official record',
    identifiers: 'Identifier',
    viewOnRegistry: 'Open the official record',
    viewOnRegistryHint:
      'The registry page is the authoritative version and may have changed since it was indexed here.',
    locations: 'Recruiting locations',
    locationsCount: '{n|country|countries}',
    locationsUnavailable:
      'Locations are not included in the offline baseline for this record. Open the official record to see the current site list.',
    interventions: 'Interventions studied',
    sponsor: 'Lead sponsor',
    enrollment: 'Target enrolment',
    enrollmentValue: '{n} participants',
    studyType: 'Study type',
    phase: 'Phase',
    status: 'Status',
    firstPosted: 'First posted',
    lastUpdate: 'Last updated on the registry',
    eligibility: 'Eligibility criteria',
    eligibilityIntro:
      'Reproduced verbatim from the official record. Eligibility is decided by the study team, never by this page.',
    eligibilityUnavailable:
      'Eligibility criteria are not included in the offline baseline for this record. They are published in full on the official record.',
    ageRange: 'Age',
    sex: 'Sex',
    contact: 'Study contact',
    contactAvailable:
      'The official record lists a study contact. Contact details are published there and are intentionally not copied to this page.',
    contactUnavailable:
      'No public contact is listed on the official record.',
    notProvided: 'Not provided in the official record',
    baselineNotice:
      'This view is built from the offline baseline indexed on {date}. Fields that the baseline does not carry are marked as unavailable rather than guessed.',
    relatedTypes: 'Indexed under',
    saveToList: 'Add to my list',
    removeFromList: 'Remove from my list',
    savedToList: 'In my list',
    notFoundTitle: 'No such record',
    notFoundBody:
      'This identifier is not in the index. It may exist on the official registry — search for it there.',
  },
  myList: {
    navLabel: 'My list',
    title: 'My list',
    eyebrow: 'Prepare for an appointment',
    intro:
      'Records you saved, collected on one page. Nothing here is a recommendation — it is your own shortlist of official entries, formatted so you can print it and go through it with your care team.',
    empty: 'Your list is empty.',
    emptyHint:
      'Open any record and choose "Add to my list" to collect it here.',
    count: '{n|record|records} saved',
    print: 'Print this page',
    clearAll: 'Clear the list',
    clearConfirm: 'Remove all saved records?',
    remove: 'Remove',
    printedOn: 'Printed on {date}',
    printIntro:
      'Official register entries collected from TrialBeacon. Each identifier can be looked up directly on the source registry.',
    questionsTitle: 'Questions you may want to ask',
    questionsIntro:
      'Adapted from the question lists published by the U.S. National Cancer Institute and the U.S. Food & Drug Administration for people considering a clinical trial.',
    questions: [
      'Is this study relevant to my diagnosis, stage and prior treatment?',
      'What is the purpose of this study, and what is already known?',
      'What tests or procedures would be involved, and how often?',
      'Which costs are covered by the study, and which are not?',
      'What are the possible risks and side effects compared with my current care?',
      'Can I leave the study at any point, and what happens if I do?',
      'Who do I contact if something goes wrong?',
      'Is there a site near enough for me to attend regularly?',
    ],
    notesLabel: 'Notes',
    disclaimerPrint:
      'TrialBeacon is an information index, not a medical service. It does not recommend, rank or endorse any study. Decisions about treatment belong to you and your clinicians.',
  },
  safety: {
    navLabel: 'Before you contact a study',
    eyebrow: 'Published safeguards',
    title: 'Before you contact a study',
    intro:
      'Points below are drawn from guidance published by public health bodies for people considering a clinical trial. They are reproduced because people looking for later-line options are frequently approached by services that are not official studies. Nothing here is advice about your treatment.',
    checksTitle: 'What official guidance says to check',
    checks: [
      {
        title: 'A registered study has a registry number',
        body:
          'Interventional studies are normally registered before enrolment and carry a public identifier such as an NCT, EudraCT/CTIS or ChiCTR number. If no identifier is offered, the study cannot be verified against a public registry.',
      },
      {
        title: 'Ethics approval is not optional',
        body:
          'Regulators require review by an ethics committee or institutional review board before people can be enrolled. A study team can tell you which body reviewed the protocol.',
      },
      {
        title: 'Informed consent is a document, not a conversation',
        body:
          'You should receive a written consent form describing the purpose, procedures, risks and your right to withdraw at any time, and be given time to read it.',
      },
      {
        title: 'Ask precisely who pays for what',
        body:
          'Investigational products are typically provided by the sponsor, while routine care costs may not be. Public guidance is consistent that you should get the cost split in writing before agreeing to anything.',
      },
      {
        title: 'Certainty is a warning sign',
        body:
          'A trial exists because the answer is not yet known. Guaranteed cures, secret protocols, and pressure to decide quickly are inconsistent with how registered research works.',
      },
    ],
    sourcesTitle: 'Read the original guidance',
    sourcesIntro:
      'These are the public pages the points above are drawn from. We link out rather than paraphrase further.',
    reportTitle: 'If something looks wrong',
    reportBody:
      'Concerns about a study can be raised with the regulator in the relevant jurisdiction, or with the ethics committee named in the consent document.',
  },
  locale: {
    label: 'Language',
  },
  dataStatus: {
    live: 'Trial records retrieved live from the ClinicalTrials.gov public API.',
    snapshot:
      'Showing the verified snapshot of official records indexed on {date}. Every link opens the live original page.',
  },
  discussionList: {
    // Launcher — the selection toolbar shown above record lists.
    launcherHeading: 'Build a discussion list',
    launcherSub:
      'Select the public official records you want to take to your appointment, then generate a list. Nothing is ranked or recommended — the list only reproduces titles and links.',
    selectedCount: '{n} selected',
    selectAll: 'Select all shown',
    clearSelection: 'Clear selection',
    generate: 'Generate discussion list',
    openPrint: 'Open printable version',
    generating: 'Generating…',
    popupBlocked:
      'The browser blocked the new window. Allow pop-ups for this site and try again, or use “Generate discussion list” to download the file directly.',
    printFallback:
      'The PDF could not be built here, so the printable version opened instead — you can print it or save it as a PDF from there.',
    exportList: 'Export as discussion list',
    useFilter: 'Use current filter results',
    limitNotePre: 'Not signed in — up to {max} records per list. Sign in for higher free limits, or ',
    seePro: 'see Pro',
    limitNotePost: ' for more exports.',
    limitExceeded:
      'Only the first {max} records were included. Sign in to export more.',
    selectRecord: 'Select this record',
    // ----- PDF / printable checklist -----
    // Pinned header on every printed / PDF page.
    pageHeaderBrand: 'TrialBeacon · Public records organiser',
    pageHeaderTag: 'Organises public official records only — not medical advice',
    // First page.
    title: 'Doctor discussion reference list',
    introHeading: 'About this list:',
    introBody:
      'This list is generated from public records the user selected themselves. It only gathers official titles, sources and registration identifiers so they can be checked against the originals with the treating doctor. It makes no recommendation, match or suitability judgement.',
    generatedDate: 'Generated on {date}',
    recordCount: '{n|record|records} organised',
    // Required category label on every entry.
    typeTrial: '【Trial record】',
    typeGuideline: '【Guideline / public regulatory information】',
    // Field labels.
    fieldTitle: 'Official title',
    fieldSource: 'Source',
    fieldId: 'Registration no.',
    fieldRegion: 'Region',
    fieldStatus: 'Status',
    fieldDate: 'Date',
    fieldGuideType: 'Type',
    // Neutral, fixed notes — verbatim, no evaluation.
    trialNote:
      'Note: this is a public clinical-trial registration. Whether it is still open or relevant to any individual should be confirmed from the official original and the doctor’s judgement.',
    guideNote:
      'Note: this is an entry point to public guidance or regulatory information, not a personal treatment plan.',
    verifyById: 'Verify using the registration number on the official site.',
    notProvided: 'Not provided',
    fieldLink: 'Original link',
    // Guideline / regulatory type values.
    guideTypeGuideline: 'Guideline index',
    guideTypeRegulatory: 'Regulatory information',
    // Neutral question prompt (teaches how to ask, gives no answers).
    promptHeading:
      'Ways to open the conversation with your doctor (reference only, not advice)',
    promptIntro:
      'A template only — it teaches how to ask, and gives no answers. Adapt these to your own situation.',
    promptCopy: 'Copy questions',
    promptCopied: 'Copied',
    promptLines: [
      'Are these public records still searchable or open to enrolment?',
      'From the literal wording of the public titles, is there any point relevant to the current situation?',
      'If there is something relevant, what should I ask you about next?',
      'For symptoms, pain or supportive care, is there a public guideline worth prioritising as a reference?',
    ],
    promptFoot:
      'These are only examples to help you start a conversation. They are not medical advice. All decisions should be made together with your treating doctor.',
    // Pinned footer on every printed / PDF page.
    footer:
      'This list only organises the titles and source information of public official records. It is not medical advice, a recommendation or a suitability judgement. Rely on the official original and your treating doctor’s judgement. TrialBeacon has no affiliation with or endorsement by any registry.',
    // Empty state when opened with no records.
    emptyTitle: 'No records to organise',
    emptyBody:
      'Go back to a record list, select some entries (or use a filter), then generate the list again.',
    backLink: 'Back to record lists',
    // Retained for structural compatibility (not shown in the neutral list).
    pageNofM: 'Page {n} of {m}',
    generatedAt: 'Generated at {datetime}',
    dataNotice:
      'Generated from public official records. Please verify on the original page, which may have changed since this list was created.',
    proBadge: 'Pro report',
    proCta: 'Upgrade for a detailed visit-prep report',
  },
  pricing: {
    nav: 'Discussion List Pro',
    // ----- /pro page -----
    eyebrow: 'Optional paid feature',
    title: 'Discussion List Pro',
    subtitle:
      'Optional tools that save time organising public official records. They do not rank, recommend, or change anything — they only make the list faster to prepare.',
    disclaimer:
      'This is a paid convenience feature. TrialBeacon still provides no medical advice, recommendations, or matching. The free plan stays available.',
    whatYouGetTitle: 'What you get',
    whatYouGet: [
      'Unlimited discussion-list generations while your plan is active',
      'Follow-list export — turn your saved records into one list',
      'Optional weekly digest email of your organised lists',
    ],
    whatYouDontTitle: 'What you do NOT get',
    whatYouDont: [
      'No medical advice, recommendations, or suitability judgement',
      'No ranking, scoring, or “best match” for any record',
      'No change to which public records are shown',
    ],
    singleTitle: 'Single unlock',
    singlePrice: '$4.9',
    singleDesc: 'One full discussion list (up to 10 records). No account change needed.',
    monthlyTitle: 'Monthly Pro',
    monthlyPrice: '$6.9',
    monthlyPer: ' / month',
    monthlyDesc:
      'Unlimited generations for one month, follow-list export, and an optional weekly digest email.',
    payWithPaypal: 'Pay with PayPal',
    paypalUnavailable: 'PayPal is not configured yet. Please check back soon.',
    comingSoon: 'Coming soon',
    otherMethodsTitle: 'Other payment methods',
    otherMethodsNote: 'WeChat Pay and Alipay are coming soon.',
    alreadyPro: 'Your Discussion List Pro is active until {date}.',
    manageTitle: 'Manage your plan',
    manageCancel: 'Cancel subscription',
    manageNote:
      'Cancelling stops future renewals. Your Pro access continues until the current period ends.',
    // ----- inline upgrade prompts (neutral) -----
    upgradeCta: 'Upgrade for more',
    freeDailyUsed:
      'You have used your free discussion list for today. Upgrade for more, or try again tomorrow.',
    reachedLimitPre: 'You have reached the free limit. ',
    reachedLimitPost: ' for higher limits.',
    freeListTooLarge:
      'This list has more than {max} records. Upgrade to include up to 10, or reduce the selection.',
    // ----- result pages -----
    successTitle: "You're all set",
    successBodyPro:
      'Your Discussion List Pro is now active. Generate as many lists as you need this month.',
    successBodySingle:
      'Your single unlock has been added — you can now generate one full list (up to 10 records).',
    successCta: 'Generate a discussion list',
    cancelTitle: 'Payment not completed',
    cancelBody: 'No charge was made. You can try again whenever you are ready.',
    errorTitle: 'Something went wrong',
    errorBody: 'We could not confirm your payment. Please try again or contact support.',
    retry: 'Try again',
    backHome: 'Back to home',
    // ----- privacy -----
    statNote:
      'Anonymous usage only — no personal health information is collected or stored.',
  },
  // Localised cancer type names + descriptors (slug-keyed).
  cancers: {
    lung: { label: 'Lung Cancer', descriptor: 'Including NSCLC and SCLC' },
    breast: { label: 'Breast Cancer', descriptor: 'All subtypes, incl. HR+, HER2+, TNBC' },
    colorectal: { label: 'Colorectal Cancer', descriptor: 'Colon and rectal cancer' },
    liver: { label: 'Liver Cancer', descriptor: 'Incl. hepatocellular carcinoma (HCC)' },
    gastric: { label: 'Gastric Cancer', descriptor: 'Stomach and gastroesophageal junction' },
    pancreatic: { label: 'Pancreatic Cancer', descriptor: 'Incl. pancreatic ductal adenocarcinoma' },
    prostate: { label: 'Prostate Cancer', descriptor: 'Incl. castration-resistant disease' },
    ovarian: { label: 'Ovarian Cancer', descriptor: 'Incl. platinum-resistant disease' },
    esophageal: { label: 'Esophageal Cancer', descriptor: 'Squamous cell and adenocarcinoma' },
    lymphoma: { label: 'Lymphoma', descriptor: 'Hodgkin and non-Hodgkin lymphoma' },
    leukemia: { label: 'Leukemia', descriptor: 'Including acute and chronic leukemias' },
  },
};


type CancerName = { label: string; descriptor: string };

/** `cancers` is keyed by slug and indexed at runtime, so widen it to a Record. */
export type Messages = Omit<typeof en, 'cancers'> & {
  cancers: Record<string, CancerName>;
};
