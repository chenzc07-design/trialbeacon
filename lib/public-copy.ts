import type { Locale } from './i18n-runtime';

export const SUPPORT_EMAIL = 'support@trialbeacon.cn';

type PrivacySection = {
  heading: string;
  body: string;
};

export type PublicCopy = {
  privacy: {
    title: string;
    description: string;
    eyebrow: string;
    intro: string;
    sections: PrivacySection[];
    contactTitle: string;
    contactBody: string;
  };
  account: {
    profileTitle: string;
    displayNameLabel: string;
    displayNameHint: string;
    saveProfile: string;
    profileSaved: string;
    profileError: string;
    passwordTitle: string;
    passwordBody: string;
    deleteTitle: string;
    deleteHint: string;
    deleteCta: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleting: string;
  };
  about: {
    contactTitle: string;
    contactBody: string;
  };
  sources: {
    sitemapTitle: string;
    sitemapBody: string;
    sitemapLinkLabel: string;
  };
  footerPrivacy: string;
};

const COPY: Record<Locale, PublicCopy> = {
  en: {
    privacy: {
      title: 'Privacy',
      description:
        'How TrialBeacon uses account, alert and payment information. No health information, diagnosis, patient or family-member status is collected.',
      eyebrow: 'Privacy',
      intro:
        'TrialBeacon is built to organise public official records without creating a health profile about you. This page explains the limited information used to operate accounts, alerts and optional paid exports.',
      sections: [
        {
          heading: 'What an account is for',
          body: 'An account is used only for sign-in, your saved follow list, optional email alerts, and optional paid-export access. We do not ask for or store symptoms, diagnosis, treatment history, sex, or whether you are a patient or family member.',
        },
        {
          heading: 'Sign-in providers',
          body: 'You can sign in with a one-time email code, Google, or Microsoft. TrialBeacon does not receive a password from Google or Microsoft. Email-code sign-in is passwordless.',
        },
        {
          heading: 'Email and alerts',
          body: 'Your email is used to sign in and, only if you choose it, to deliver weekly alert emails. You can stop alerts from your account or unsubscribe from any alert email.',
        },
        {
          heading: 'Payments and deletion',
          body: 'Optional payments are handled through PayPal. If you delete your account, TrialBeacon deletes account preferences, follows and email subscriptions and removes the email link from stored payment metadata. A minimum anonymous payment record may remain where needed for financial reconciliation.',
        },
        {
          heading: 'Anonymous operational statistics',
          body: 'The owner dashboard records only aggregate event counts such as page views, discussion-list generation attempts, free-limit notices, Pro visits and successful payments. It does not store search terms, health details, or advertising profiles.',
        },
      ],
      contactTitle: 'Privacy contact',
      contactBody: 'For a privacy or account-data question, contact the site operator at',
    },
    account: {
      profileTitle: 'Profile',
      displayNameLabel: 'Display name (optional)',
      displayNameHint: 'A nickname for this account only. Do not enter health or diagnosis information.',
      saveProfile: 'Save display name',
      profileSaved: 'Display name saved.',
      profileError: 'Could not save the display name. Please try again.',
      passwordTitle: 'Password and access',
      passwordBody: 'Email sign-in uses a one-time code, not a stored password. To regain access, request a new code from the sign-in window. Google and Microsoft sign-in are managed by those providers.',
      deleteTitle: 'Delete account',
      deleteHint: 'After confirmation, TrialBeacon deletes this account’s display name, saved records, follow preferences and email subscription, then signs you out. Payment records keep only the minimum necessary reconciliation data and are no longer linked to your email. This cannot be undone.',
      deleteCta: 'Delete account',
      deleteConfirm: 'Confirm — delete account',
      deleteCancel: 'Cancel',
      deleting: 'Deleting account…',
    },
    about: {
      contactTitle: 'Contact',
      contactBody: 'For operational or privacy questions, contact the site operator at',
    },
    sources: {
      sitemapTitle: 'Search indexing',
      sitemapBody: 'The public sitemap is ready for submission to Google Search Console. Site verification is completed by the site operator in Google Search Console.',
      sitemapLinkLabel: 'Open sitemap.xml',
    },
    footerPrivacy: 'Privacy',
  },
  zh: {
    privacy: {
      title: '隐私说明',
      description: '说明 TrialBeacon 如何使用账户、提醒和付款信息。不收集健康信息、诊断、患者或家属身份。',
      eyebrow: '隐私',
      intro: 'TrialBeacon 旨在整理公开官方记录，而不是为您建立健康画像。本页说明运营账户、提醒和可选付费导出时所使用的有限信息。',
      sections: [
        { heading: '账户用途', body: '账户仅用于登录、保存关注列表、可选的邮件提醒以及可选的付费导出权限。我们不会询问或保存症状、诊断、治疗史、性别，或您是否为患者或家属。' },
        { heading: '登录提供方', body: '您可以使用一次性邮箱验证码、Google 或 Microsoft 登录。TrialBeacon 不会从 Google 或 Microsoft 获取密码。邮箱验证码登录不使用密码。' },
        { heading: '邮箱与提醒', body: '您的邮箱用于登录；只有在您选择后，才用于发送每周提醒。您可以在账户中关闭提醒，或通过任一提醒邮件退订。' },
        { heading: '付款与注销', body: '可选付款由 PayPal 处理。删除账户后，TrialBeacon 会删除账户偏好、关注和邮件订阅，并移除付款元数据中的邮箱关联。因财务核对需要，可能保留最小化且匿名的付款记录。' },
        { heading: '匿名运营统计', body: '经营后台仅记录页面浏览、沟通清单生成尝试、免费限额提示、Pro 访问和付款成功等汇总事件计数；不保存搜索词、健康细节或广告画像。' },
      ],
      contactTitle: '隐私联系',
      contactBody: '如有隐私或账户数据问题，请联系网站运营方：',
    },
    account: {
      profileTitle: '个人资料',
      displayNameLabel: '显示名（选填）',
      displayNameHint: '仅用于此账户的昵称。请勿填写健康或诊断信息。',
      saveProfile: '保存显示名',
      profileSaved: '显示名已保存。',
      profileError: '显示名保存失败，请重试。',
      passwordTitle: '密码与访问',
      passwordBody: '邮箱登录使用一次性验证码，不保存密码。如需重新访问，请在登录窗口请求新的验证码。Google 和 Microsoft 登录由相应提供方管理。',
      deleteTitle: '注销账号',
      deleteHint: '确认后，TrialBeacon 会删除该账户的显示名、保存记录、关注偏好和邮件订阅，并退出登录。付款记录仅保留财务核对所需的最小信息，且不再关联您的邮箱。此操作不可撤销。',
      deleteCta: '注销账号',
      deleteConfirm: '确认——注销账号',
      deleteCancel: '取消',
      deleting: '正在注销账号…',
    },
    about: { contactTitle: '联系', contactBody: '如有运营或隐私问题，请联系网站运营方：' },
    sources: { sitemapTitle: '搜索收录', sitemapBody: '公开 sitemap 已可提交至 Google Search Console。站点验证需由网站运营方在 Google Search Console 中完成。', sitemapLinkLabel: '打开 sitemap.xml' },
    footerPrivacy: '隐私说明',
  },
  fr: {
    privacy: {
      title: 'Confidentialité',
      description: 'Comment TrialBeacon utilise les informations de compte, d’alerte et de paiement. Aucune information de santé, diagnostic ou qualité de patient/proche n’est collectée.',
      eyebrow: 'Confidentialité',
      intro: 'TrialBeacon organise des dossiers publics officiels sans créer de profil de santé à votre sujet. Cette page décrit les informations limitées utilisées pour les comptes, alertes et exports payants optionnels.',
      sections: [
        { heading: 'Utilité du compte', body: 'Un compte sert uniquement à la connexion, à votre liste suivie, aux alertes e-mail facultatives et à l’accès aux exports payants facultatifs. Nous ne demandons ni ne stockons symptômes, diagnostic, historique de traitement, sexe ou statut de patient/proche.' },
        { heading: 'Fournisseurs de connexion', body: 'Vous pouvez vous connecter avec un code e-mail à usage unique, Google ou Microsoft. TrialBeacon ne reçoit aucun mot de passe de Google ou Microsoft. La connexion par code e-mail est sans mot de passe.' },
        { heading: 'E-mail et alertes', body: 'Votre e-mail sert à la connexion et, uniquement si vous le choisissez, à envoyer les alertes hebdomadaires. Vous pouvez arrêter les alertes depuis votre compte ou vous désabonner depuis n’importe quel e-mail d’alerte.' },
        { heading: 'Paiements et suppression', body: 'Les paiements facultatifs sont gérés par PayPal. En supprimant votre compte, TrialBeacon efface les préférences, suivis et abonnements e-mail et retire le lien avec votre e-mail des métadonnées de paiement. Un enregistrement de paiement anonyme minimal peut rester pour le rapprochement financier.' },
        { heading: 'Statistiques opérationnelles anonymes', body: 'Le tableau de bord enregistre uniquement des compteurs agrégés, comme les pages vues, les tentatives de liste de discussion, les avis de limite gratuite, les visites Pro et les paiements réussis. Il ne stocke ni termes de recherche, ni détails de santé, ni profils publicitaires.' },
      ],
      contactTitle: 'Contact confidentialité',
      contactBody: 'Pour une question de confidentialité ou de données de compte, contactez l’opérateur du site à',
    },
    account: {
      profileTitle: 'Profil', displayNameLabel: 'Nom affiché (facultatif)', displayNameHint: 'Un pseudonyme pour ce compte uniquement. N’indiquez aucune information de santé ou de diagnostic.', saveProfile: 'Enregistrer le nom affiché', profileSaved: 'Nom affiché enregistré.', profileError: 'Impossible d’enregistrer le nom affiché. Réessayez.', passwordTitle: 'Mot de passe et accès', passwordBody: 'La connexion par e-mail utilise un code unique, pas un mot de passe enregistré. Pour retrouver l’accès, demandez un nouveau code dans la fenêtre de connexion. Les connexions Google et Microsoft sont gérées par ces fournisseurs.', deleteTitle: 'Supprimer le compte', deleteHint: 'Après confirmation, TrialBeacon supprime le nom affiché, les dossiers sauvegardés, les préférences de suivi et l’abonnement e-mail, puis vous déconnecte. Les paiements ne conservent que les données minimales de rapprochement et ne sont plus liés à votre e-mail. Cette action est irréversible.', deleteCta: 'Supprimer le compte', deleteConfirm: 'Confirmer — supprimer le compte', deleteCancel: 'Annuler', deleting: 'Suppression du compte…',
    },
    about: { contactTitle: 'Contact', contactBody: 'Pour toute question opérationnelle ou de confidentialité, contactez l’opérateur du site à' },
    sources: { sitemapTitle: 'Indexation dans les moteurs', sitemapBody: 'Le sitemap public peut être soumis à Google Search Console. La vérification du site est effectuée par l’opérateur dans Google Search Console.', sitemapLinkLabel: 'Ouvrir sitemap.xml' },
    footerPrivacy: 'Confidentialité',
  },
  de: {
    privacy: {
      title: 'Datenschutz',
      description: 'Wie TrialBeacon Konto-, Benachrichtigungs- und Zahlungsinformationen nutzt. Es werden keine Gesundheitsdaten, Diagnosen oder Angaben zum Patienten-/Angehörigenstatus erhoben.',
      eyebrow: 'Datenschutz',
      intro: 'TrialBeacon ordnet öffentliche offizielle Einträge, ohne ein Gesundheitsprofil über Sie zu erstellen. Diese Seite beschreibt die begrenzten Informationen für Konten, Benachrichtigungen und optionale kostenpflichtige Exporte.',
      sections: [
        { heading: 'Wofür ein Konto dient', body: 'Ein Konto dient nur zur Anmeldung, für Ihre Merkliste, optionale E-Mail-Benachrichtigungen und optionalen Zugriff auf kostenpflichtige Exporte. Wir fragen nicht nach Symptomen, Diagnose, Behandlungsverlauf, Geschlecht oder Patienten-/Angehörigenstatus und speichern diese nicht.' },
        { heading: 'Anmeldeanbieter', body: 'Sie können sich mit einem einmaligen E-Mail-Code, Google oder Microsoft anmelden. TrialBeacon erhält niemals ein Passwort von Google oder Microsoft. Die Anmeldung per E-Mail-Code ist passwortlos.' },
        { heading: 'E-Mail und Benachrichtigungen', body: 'Ihre E-Mail dient zur Anmeldung und nur nach Ihrer Wahl für wöchentliche Benachrichtigungen. Sie können Benachrichtigungen im Konto beenden oder sich über jede Benachrichtigungs-E-Mail abmelden.' },
        { heading: 'Zahlungen und Löschung', body: 'Optionale Zahlungen werden über PayPal abgewickelt. Beim Löschen des Kontos entfernt TrialBeacon Kontoeinstellungen, Folgen und E-Mail-Abonnements und löst die E-Mail-Verknüpfung in Zahlungsmetadaten. Ein minimaler anonymer Zahlungsdatensatz kann für den Finanzabgleich verbleiben.' },
        { heading: 'Anonyme Betriebsstatistiken', body: 'Das Eigentümer-Dashboard speichert nur aggregierte Ereigniszähler wie Seitenaufrufe, Versuche einer Gesprächsliste, Hinweise zur kostenlosen Grenze, Pro-Besuche und erfolgreiche Zahlungen. Es speichert keine Suchbegriffe, Gesundheitsdaten oder Werbeprofile.' },
      ],
      contactTitle: 'Datenschutzkontakt',
      contactBody: 'Bei Fragen zu Datenschutz oder Kontodaten kontaktieren Sie den Betreiber unter',
    },
    account: {
      profileTitle: 'Profil', displayNameLabel: 'Anzeigename (optional)', displayNameHint: 'Ein Spitzname nur für dieses Konto. Geben Sie keine Gesundheits- oder Diagnoseinformationen ein.', saveProfile: 'Anzeigenamen speichern', profileSaved: 'Anzeigename gespeichert.', profileError: 'Anzeigename konnte nicht gespeichert werden. Bitte erneut versuchen.', passwordTitle: 'Passwort und Zugriff', passwordBody: 'Die E-Mail-Anmeldung verwendet einen Einmalcode, kein gespeichertes Passwort. Um wieder Zugang zu erhalten, fordern Sie im Anmeldefenster einen neuen Code an. Google- und Microsoft-Anmeldung werden von diesen Anbietern verwaltet.', deleteTitle: 'Konto löschen', deleteHint: 'Nach Bestätigung löscht TrialBeacon Anzeigename, gespeicherte Einträge, Folgepräferenzen und E-Mail-Abonnement und meldet Sie ab. Zahlungsunterlagen behalten nur die minimal nötigen Abgleichdaten und sind nicht mehr mit Ihrer E-Mail verknüpft. Dies kann nicht rückgängig gemacht werden.', deleteCta: 'Konto löschen', deleteConfirm: 'Bestätigen — Konto löschen', deleteCancel: 'Abbrechen', deleting: 'Konto wird gelöscht…',
    },
    about: { contactTitle: 'Kontakt', contactBody: 'Bei betrieblichen oder Datenschutzfragen kontaktieren Sie den Betreiber unter' },
    sources: { sitemapTitle: 'Suchindexierung', sitemapBody: 'Die öffentliche Sitemap kann bei der Google Search Console eingereicht werden. Die Website-Verifizierung führt der Betreiber in der Google Search Console durch.', sitemapLinkLabel: 'sitemap.xml öffnen' },
    footerPrivacy: 'Datenschutz',
  },
  ja: {
    privacy: {
      title: 'プライバシー',
      description: 'TrialBeacon がアカウント、通知、支払い情報をどのように使用するかを説明します。健康情報、診断、患者・家族の区分は収集しません。',
      eyebrow: 'プライバシー',
      intro: 'TrialBeacon は、あなたに関する健康プロファイルを作成せずに公開公式記録を整理します。このページでは、アカウント、通知、任意の有料エクスポートを運用するために使用する限定的な情報を説明します。',
      sections: [
        { heading: 'アカウントの用途', body: 'アカウントはログイン、保存したフォロー一覧、任意のメール通知、任意の有料エクスポートへのアクセスにのみ使用します。症状、診断、治療歴、性別、患者・家族の別は求めず、保存しません。' },
        { heading: 'ログイン提供元', body: '1 回限りのメールコード、Google、Microsoft でログインできます。TrialBeacon が Google または Microsoft からパスワードを受け取ることはありません。メールコードのログインはパスワードレスです。' },
        { heading: 'メールと通知', body: 'メールアドレスはログインに使用し、選択した場合に限り週次通知の送信に使用します。通知はアカウントから停止でき、各通知メールから購読解除もできます。' },
        { heading: '支払いと削除', body: '任意の支払いは PayPal が処理します。アカウントを削除すると、TrialBeacon は設定、フォロー、メール購読を削除し、支払いメタデータからメールの関連付けを外します。財務照合のため最小限の匿名支払い記録が残る場合があります。' },
        { heading: '匿名の運用統計', body: '運営ダッシュボードは、ページビュー、会話リスト生成試行、無料上限通知、Pro 訪問、支払い成功などの集計イベント数のみを記録します。検索語、健康詳細、広告プロファイルは保存しません。' },
      ],
      contactTitle: 'プライバシーに関する連絡先',
      contactBody: 'プライバシーまたはアカウントデータに関する質問は、サイト運営者までご連絡ください：',
    },
    account: {
      profileTitle: 'プロフィール', displayNameLabel: '表示名（任意）', displayNameHint: 'このアカウント用のニックネームです。健康や診断の情報は入力しないでください。', saveProfile: '表示名を保存', profileSaved: '表示名を保存しました。', profileError: '表示名を保存できませんでした。もう一度お試しください。', passwordTitle: 'パスワードとアクセス', passwordBody: 'メールログインでは保存済みパスワードではなく 1 回限りのコードを使います。再度アクセスするには、ログイン画面で新しいコードをリクエストしてください。Google と Microsoft のログインは各提供元が管理します。', deleteTitle: 'アカウントを削除', deleteHint: '確認後、TrialBeacon は表示名、保存済み記録、フォロー設定、メール購読を削除してログアウトします。支払い記録には照合に必要な最小限のデータだけが残り、メールには関連付けられません。この操作は取り消せません。', deleteCta: 'アカウントを削除', deleteConfirm: '確認してアカウントを削除', deleteCancel: 'キャンセル', deleting: 'アカウントを削除中…',
    },
    about: { contactTitle: '連絡先', contactBody: '運営またはプライバシーに関する質問は、サイト運営者までご連絡ください：' },
    sources: { sitemapTitle: '検索インデックス', sitemapBody: '公開 sitemap は Google Search Console に送信できます。サイトの確認は運営者が Google Search Console 内で行います。', sitemapLinkLabel: 'sitemap.xml を開く' },
    footerPrivacy: 'プライバシー',
  },
  ko: {
    privacy: {
      title: '개인정보 처리방침',
      description: 'TrialBeacon이 계정, 알림 및 결제 정보를 사용하는 방법입니다. 건강 정보, 진단, 환자 또는 가족 여부는 수집하지 않습니다.',
      eyebrow: '개인정보',
      intro: 'TrialBeacon은 건강 프로필을 만들지 않고 공개 공식 기록을 정리합니다. 이 페이지는 계정, 알림 및 선택적 유료 내보내기를 운영하기 위해 사용하는 제한된 정보를 설명합니다.',
      sections: [
        { heading: '계정의 용도', body: '계정은 로그인, 저장한 팔로우 목록, 선택적 이메일 알림 및 선택적 유료 내보내기 접근에만 사용됩니다. 증상, 진단, 치료 이력, 성별, 환자 또는 가족 여부를 요청하거나 저장하지 않습니다.' },
        { heading: '로그인 제공자', body: '일회용 이메일 코드, Google 또는 Microsoft로 로그인할 수 있습니다. TrialBeacon은 Google이나 Microsoft에서 비밀번호를 받지 않습니다. 이메일 코드 로그인은 비밀번호가 없습니다.' },
        { heading: '이메일과 알림', body: '이메일은 로그인에 사용되며, 선택한 경우에만 주간 알림 발송에 사용됩니다. 계정에서 알림을 중지하거나 모든 알림 이메일에서 구독을 취소할 수 있습니다.' },
        { heading: '결제와 삭제', body: '선택적 결제는 PayPal에서 처리합니다. 계정을 삭제하면 TrialBeacon은 계정 설정, 팔로우 및 이메일 구독을 삭제하고 결제 메타데이터에서 이메일 연결을 제거합니다. 재무 조정을 위해 최소한의 익명 결제 기록이 남을 수 있습니다.' },
        { heading: '익명 운영 통계', body: '운영 대시보드는 페이지 조회, 대화 목록 생성 시도, 무료 한도 알림, Pro 방문 및 결제 성공과 같은 집계 이벤트 수만 기록합니다. 검색어, 건강 정보 또는 광고 프로필은 저장하지 않습니다.' },
      ],
      contactTitle: '개인정보 문의',
      contactBody: '개인정보 또는 계정 데이터 관련 문의는 사이트 운영자에게 연락해 주세요:',
    },
    account: {
      profileTitle: '프로필', displayNameLabel: '표시 이름(선택)', displayNameHint: '이 계정에만 쓰는 별명입니다. 건강 또는 진단 정보를 입력하지 마세요.', saveProfile: '표시 이름 저장', profileSaved: '표시 이름을 저장했습니다.', profileError: '표시 이름을 저장할 수 없습니다. 다시 시도해 주세요.', passwordTitle: '비밀번호 및 접근', passwordBody: '이메일 로그인은 저장된 비밀번호가 아니라 일회용 코드를 사용합니다. 다시 접근하려면 로그인 창에서 새 코드를 요청하세요. Google 및 Microsoft 로그인은 해당 제공자가 관리합니다.', deleteTitle: '계정 삭제', deleteHint: '확인 후 TrialBeacon은 표시 이름, 저장 기록, 팔로우 설정 및 이메일 구독을 삭제하고 로그아웃합니다. 결제 기록은 정산에 필요한 최소 데이터만 남기며 이메일과 더 이상 연결되지 않습니다. 이 작업은 되돌릴 수 없습니다.', deleteCta: '계정 삭제', deleteConfirm: '확인 — 계정 삭제', deleteCancel: '취소', deleting: '계정을 삭제하는 중…',
    },
    about: { contactTitle: '연락처', contactBody: '운영 또는 개인정보 관련 문의는 사이트 운영자에게 연락해 주세요:' },
    sources: { sitemapTitle: '검색 색인', sitemapBody: '공개 sitemap을 Google Search Console에 제출할 수 있습니다. 사이트 확인은 운영자가 Google Search Console에서 완료합니다.', sitemapLinkLabel: 'sitemap.xml 열기' },
    footerPrivacy: '개인정보 처리방침',
  },
};

export function getPublicCopy(locale: Locale): PublicCopy {
  return COPY[locale] ?? COPY.en;
}

export function cancerSeo(locale: Locale, cancerName: string): { title: string; description: string } {
  const generic = getPublicCopy(locale);
  const map: Record<Locale, { title: string; description: string }> = {
    en: {
      title: `Advanced / metastatic ${cancerName} clinical trials — official public records`,
      description: `Official records for advanced or metastatic ${cancerName.toLowerCase()} clinical trials, with links to originals and a discussion list for your clinician. No recommendations.`,
    },
    zh: {
      title: `晚期／转移性${cancerName}临床试验——官方公开记录`,
      description: `面向晚期或转移性${cancerName}临床试验的官方公开记录，提供原始页面链接与供临床医生讨论的清单；不提供推荐。`,
    },
    fr: {
      title: `Essais cliniques ${cancerName} avancé / métastatique — dossiers publics officiels`,
      description: `Dossiers officiels d’essais cliniques pour le ${cancerName.toLowerCase()} avancé ou métastatique, avec liens originaux et liste de discussion pour votre clinicien. Aucune recommandation.`,
    },
    de: {
      title: `Klinische Studien bei fortgeschrittenem / metastasiertem ${cancerName} — offizielle öffentliche Einträge`,
      description: `Offizielle Einträge zu klinischen Studien bei fortgeschrittenem oder metastasiertem ${cancerName.toLowerCase()}, mit Links zu Originalen und einer Gesprächsliste für Ihre behandelnde Fachperson. Keine Empfehlungen.`,
    },
    ja: {
      title: `進行・転移性${cancerName}の臨床試験 — 公式公開記録`,
      description: `進行・転移性${cancerName}の臨床試験に関する公式公開記録。原典へのリンクと担当臨床医との相談用リストを提供し、推奨は行いません。`,
    },
    ko: {
      title: `진행성 / 전이성 ${cancerName} 임상시험 — 공식 공개 기록`,
      description: `진행성 또는 전이성 ${cancerName} 임상시험의 공식 기록으로, 원문 링크와 담당 의료진과 논의할 목록을 제공합니다. 권고하지 않습니다.`,
    },
  };
  return map[locale] ?? { title: generic.privacy.title, description: generic.privacy.description };
}

export function afterCareSeo(locale: Locale): { title: string; description: string } {
  const map: Record<Locale, { title: string; description: string }> = {
    en: { title: 'Later-line and advanced cancer official records', description: 'Official public records for advanced, recurrent, later-line, supportive and palliative-care wording, with direct links to originals. No recommendations.' },
    zh: { title: '后线与晚期癌症官方公开记录', description: '汇集标题或范围明确包含晚期、复发、后线、支持或姑息照护表述的官方公开记录，并提供原始页面直链；不提供推荐。' },
    fr: { title: 'Dossiers officiels pour cancers avancés et traitements ultérieurs', description: 'Dossiers publics officiels dont le titre ou le périmètre mentionne les situations avancées, récidivantes, de ligne ultérieure, de soutien ou palliatives, avec liens directs. Aucune recommandation.' },
    de: { title: 'Offizielle Einträge für fortgeschrittene Erkrankung und spätere Behandlungslinien', description: 'Öffentliche offizielle Einträge mit Formulierungen zu fortgeschrittener, wiederkehrender, späterer, unterstützender oder palliativer Versorgung, mit direkten Original-Links. Keine Empfehlungen.' },
    ja: { title: '後治療ライン・進行がんの公式公開記録', description: '進行、再発、後治療ライン、支持療法または緩和ケアを明示する公式公開記録を原典への直接リンクとともに掲載します。推奨は行いません。' },
    ko: { title: '후치료선 및 진행성 암 공식 공개 기록', description: '진행성, 재발성, 후치료선, 지지 또는 완화 돌봄을 명시한 공식 공개 기록을 원문 직링크와 함께 제공합니다. 권고하지 않습니다.' },
  };
  return map[locale] ?? map.en;
}

export function proSeo(locale: Locale): { title: string; description: string } {
  const map: Record<Locale, { title: string; description: string }> = {
    en: { title: 'Pro discussion-list exports', description: 'Optional TrialBeacon export access for organising public official records into a discussion list for your clinician. No recommendations or matching.' },
    zh: { title: 'Pro 沟通清单导出', description: '可选的 TrialBeacon 导出权限，用于将公开官方记录整理为供临床医生讨论的清单；不提供推荐或匹配。' },
    fr: { title: 'Exports Pro de listes de discussion', description: 'Accès facultatif à l’export TrialBeacon pour organiser des dossiers publics officiels en liste de discussion avec votre clinicien. Aucune recommandation ni mise en relation.' },
    de: { title: 'Pro-Exporte für Gesprächslisten', description: 'Optionaler TrialBeacon-Exportzugang, um offizielle öffentliche Einträge für ein Gespräch mit Ihrer behandelnden Fachperson zu organisieren. Keine Empfehlungen oder Zuordnung.' },
    ja: { title: 'Pro の相談用リスト出力', description: '公開公式記録を担当臨床医との相談用リストに整理するための任意の TrialBeacon 出力アクセスです。推奨やマッチングは行いません。' },
    ko: { title: 'Pro 대화 목록 내보내기', description: '공개 공식 기록을 담당 의료진과 논의할 목록으로 정리하기 위한 선택형 TrialBeacon 내보내기 기능입니다. 권고나 매칭은 제공하지 않습니다.' },
  };
  return map[locale] ?? map.en;
}
