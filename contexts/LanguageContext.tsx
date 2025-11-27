
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja';

type TranslationKeys = {
  [key: string]: string | any;
};

export const translations: Record<Language, TranslationKeys> = {
  en: {
    appName: "PromptMaster",
    tabs: { generator: "Generator", refiner: "Refiner", history: "History", settings: "Settings" },
    generator: {
      crafting: "Crafting Prompt...",
      generate: "Generate Prompt",
      coreTask: "Goal / Core Task",
      context: "Context / Constraints",
      tone: "Tone",
      format: "Format",
      model: "Model",
      templates: "Quick Start Templates",
      clear: "Clear",
      promptStrength: { weak: "Weak", good: "Good", strong: "Strong" },
      placeholders: {
        task: "e.g. Write a marketing email, Debug this React code",
        context: "Target audience, word count, style constraints..."
      }
    },
    refiner: {
      originalPrompt: "Original Prompt",
      refinementActions: "Refinement Actions",
      formatOutput: "Format Output",
      tone: "Tone",
      persona: "Persona",
      customInstruction: "Custom Instruction",
      run: "Run",
      loopToInput: "Loop to Input",
      clear: "Clear",
      placeholders: {
        input: "Paste your rough draft prompt here...",
        custom: "e.g. 'Translate to Spanish'"
      },
      actions: {
        optimize: "Optimize",
        grammar: "Fix Grammar",
        simplify: "Simplify",
        shorten: "Shorten",
        expand: "Expand",
        json: "JSON",
        markdown: "Markdown",
        table: "Table"
      }
    },
    common: {
      save: "Save",
      copy: "Copy",
      copied: "Copied",
      result: "Result",
      search: "Search prompts...",
      noSaved: "No saved prompts yet.",
      noMatching: "No matching prompts found.",
      savedPrompts: "Saved Prompts",
      found: "Found",
      sortBy: "Sort by",
      sortDate: "Date",
      sortName: "Name",
      sortCategory: "Category",
      delete: "Delete",
      clearHistory: "Clear History",
      exportData: "Export Data (JSON)",
      privacyMode: "Privacy Mode",
      online: "Online",
      securityNote: "Security Note",
      securityText: "API Keys are handled securely. In production, requests are routed through a backend proxy.",
      appearance: "Appearance",
      darkMode: "Dark Mode",
      darkModeDesc: "Toggle dark color scheme",
      privacyData: "Privacy & Data",
      privacyModeDesc: "Do not send logs or sync data to server",
      localHistory: "Local History",
      localHistoryDesc: "Save generated prompts to this device",
      dataManagement: "Data Management",
      confirmClear: "Clear all saved prompts?",
      cancel: "Cancel",
      confirmYes: "Yes, Clear History",
      support: "Support Development",
      donate: "Donate",
      donateDesc: "This tool is free and open-source. Your support helps cover API costs and development time.",
      coffee: "Buy me a coffee",
      stripe: "Support via Stripe",
      mascot: "Promptly the Bot"
    },
    tutorial: {
      start: "Start Tutorial",
      next: "Next",
      prev: "Prev",
      finish: "Finish",
      skip: "Skip",
      steps: {
        welcome: { title: "Welcome to PromptMaster!", content: "Let's take a quick tour to help you master AI prompting. Also, meet Promptly the Bot in the corner! Click him for a fun tip." },
        support: { title: "Support & Donate", content: "Find this tool useful? Click here to support ongoing development." },
        model: { title: "Choose Your Model", content: "Switch between 'Flash' for speed and 'Pro' for complex reasoning." },
        task: { title: "Core Task", content: "This is the most important part. Describe exactly what you want the AI to do." },
        context: { title: "Add Context", content: "Provide constraints, background info, or target audience details here." },
        templates: { title: "Quick Templates", content: "Stuck? Click one of these to fill out the form instantly." },
        generate: { title: "Generate", content: "Click here to craft your optimized prompt using Google Gemini." },
        refinerNav: { title: "Refiner Tab", content: "Have an existing prompt? Switch here to polish and improve it." },
        refinerInput: { title: "Input Draft", content: "Paste your rough prompt or text here." },
        refinerActions: { title: "Quick Actions", content: "Use these buttons to instantly Fix Grammar, Shorten, or Optimize." },
        historyNav: { title: "History", content: "All your created prompts are saved here automatically." },
        historySearch: { title: "Smart Search", content: "Filter your history by keyword, or use AND/OR logic." },
        settingsNav: { title: "Settings", content: "Configure themes, privacy, and manage your data." }
      }
    }
  },
  es: {
    appName: "PromptMaster",
    tabs: { generator: "Generador", refiner: "Refinador", history: "Historial", settings: "Ajustes" },
    generator: {
      crafting: "Creando Prompt...",
      generate: "Generar Prompt",
      coreTask: "Objetivo / Tarea Principal",
      context: "Contexto / Restricciones",
      tone: "Tono",
      format: "Formato",
      model: "Modelo",
      templates: "Plantillas Rápidas",
      clear: "Limpiar",
      promptStrength: { weak: "Débil", good: "Bueno", strong: "Fuerte" },
      placeholders: {
        task: "ej. Escribe un email de marketing, Depura este código React",
        context: "Audiencia objetivo, recuento de palabras, restricciones de estilo..."
      }
    },
    refiner: {
      originalPrompt: "Prompt Original",
      refinementActions: "Acciones de Refinamiento",
      formatOutput: "Formato de Salida",
      tone: "Tono",
      persona: "Persona",
      customInstruction: "Instrucción Personalizada",
      run: "Ejecutar",
      loopToInput: "Usar como Entrada",
      clear: "Limpiar",
      placeholders: {
        input: "Pega tu borrador de prompt aquí...",
        custom: "ej. 'Traducir al español'"
      },
      actions: {
        optimize: "Optimizar",
        grammar: "Gramática",
        simplify: "Simplificar",
        shorten: "Acortar",
        expand: "Expandir",
        json: "JSON",
        markdown: "Markdown",
        table: "Tabla"
      }
    },
    common: {
      save: "Guardar",
      copy: "Copiar",
      copied: "Copiado",
      result: "Resultado",
      search: "Buscar prompts...",
      noSaved: "No hay prompts guardados.",
      noMatching: "No se encontraron prompts.",
      savedPrompts: "Prompts Guardados",
      found: "Encontrado",
      sortBy: "Ordenar por",
      sortDate: "Fecha",
      sortName: "Nombre",
      sortCategory: "Categoría",
      delete: "Eliminar",
      clearHistory: "Borrar Historial",
      exportData: "Exportar Datos (JSON)",
      privacyMode: "Modo Privacidad",
      online: "En línea",
      securityNote: "Nota de Seguridad",
      securityText: "Las claves API se manejan de forma segura. En producción, las solicitudes se enrutan a través de un proxy.",
      appearance: "Apariencia",
      darkMode: "Modo Oscuro",
      darkModeDesc: "Alternar esquema de colores oscuros",
      privacyData: "Privacidad y Datos",
      privacyModeDesc: "No enviar registros ni sincronizar datos",
      localHistory: "Historial Local",
      localHistoryDesc: "Guardar prompts generados en este dispositivo",
      dataManagement: "Gestión de Datos",
      confirmClear: "¿Borrar todos los prompts?",
      cancel: "Cancelar",
      confirmYes: "Sí, Borrar Historial",
      support: "Apoyar Desarrollo",
      donate: "Donar",
      donateDesc: "Esta herramienta es gratuita. Tu apoyo ayuda a cubrir costos de API y desarrollo.",
      coffee: "Cómprame un café",
      stripe: "Apoyar vía Stripe",
      mascot: "Promptly el Bot"
    },
    tutorial: {
      start: "Iniciar Tutorial",
      next: "Siguiente",
      prev: "Anterior",
      finish: "Finalizar",
      skip: "Saltar",
      steps: {
        welcome: { title: "¡Bienvenido a PromptMaster!", content: "Hagamos un recorrido rápido para dominar los prompts. ¡Y conoce a Promptly el Bot abajo! Haz clic en él para consejos divertidos." },
        support: { title: "Apoyar y Donar", content: "¿Te sirve la herramienta? Clic aquí para apoyar el desarrollo continuo." },
        model: { title: "Elige tu Modelo", content: "Cambia entre 'Flash' para velocidad y 'Pro' para razonamiento complejo." },
        task: { title: "Tarea Principal", content: "Esta es la parte más importante. Describe exactamente qué quieres que haga la IA." },
        context: { title: "Añadir Contexto", content: "Proporciona restricciones, antecedentes o detalles de la audiencia aquí." },
        templates: { title: "Plantillas Rápidas", content: "¿Atascado? Haz clic en una de estas para rellenar el formulario al instante." },
        generate: { title: "Generar", content: "Haz clic aquí para crear tu prompt optimizado usando Google Gemini." },
        refinerNav: { title: "Pestaña Refinador", content: "¿Tienes un prompt existente? Cambia aquí para pulirlo y mejorarlo." },
        refinerInput: { title: "Borrador de Entrada", content: "Pega tu prompt o texto borrador aquí." },
        refinerActions: { title: "Acciones Rápidas", content: "Usa estos botones para corregir gramática, acortar u optimizar instantáneamente." },
        historyNav: { title: "Historial", content: "Todos tus prompts creados se guardan aquí automáticamente." },
        historySearch: { title: "Búsqueda Inteligente", content: "Filtra tu historial por palabra clave o usa lógica AND/OR." },
        settingsNav: { title: "Ajustes", content: "Configura temas, privacidad y gestiona tus datos." }
      }
    }
  },
  fr: {
    appName: "PromptMaster",
    tabs: { generator: "Générateur", refiner: "Raffineur", history: "Historique", settings: "Paramètres" },
    generator: {
      crafting: "Création...",
      generate: "Générer le Prompt",
      coreTask: "Objectif / Tâche Principale",
      context: "Contexte / Contraintes",
      tone: "Ton",
      format: "Format",
      model: "Modèle",
      templates: "Modèles Rapides",
      clear: "Effacer",
      promptStrength: { weak: "Faible", good: "Bon", strong: "Fort" },
      placeholders: {
        task: "ex. Rédiger un email marketing, Déboguer ce code React",
        context: "Public cible, nombre de mots, contraintes de style..."
      }
    },
    refiner: {
      originalPrompt: "Prompt Original",
      refinementActions: "Actions de Raffinement",
      formatOutput: "Format de Sortie",
      tone: "Ton",
      persona: "Persona",
      customInstruction: "Instruction Personnalisée",
      run: "Exécuter",
      loopToInput: "Boucler sur l'Entrée",
      clear: "Effacer",
      placeholders: {
        input: "Collez votre brouillon ici...",
        custom: "ex. 'Traduire en français'"
      },
      actions: {
        optimize: "Optimiser",
        grammar: "Grammaire",
        simplify: "Simplifier",
        shorten: "Raccourcir",
        expand: "Développer",
        json: "JSON",
        markdown: "Markdown",
        table: "Tableau"
      }
    },
    common: {
      save: "Enregistrer",
      copy: "Copier",
      copied: "Copié",
      result: "Résultat",
      search: "Rechercher...",
      noSaved: "Aucun prompt enregistré.",
      noMatching: "Aucun résultat.",
      savedPrompts: "Prompts Enregistrés",
      found: "Trouvé",
      sortBy: "Trier par",
      sortDate: "Date",
      sortName: "Nom",
      sortCategory: "Catégorie",
      delete: "Supprimer",
      clearHistory: "Effacer l'Historique",
      exportData: "Exporter (JSON)",
      privacyMode: "Mode Privé",
      online: "En ligne",
      securityNote: "Note de Sécurité",
      securityText: "Les clés API sont gérées en toute sécurité.",
      appearance: "Apparence",
      darkMode: "Mode Sombre",
      darkModeDesc: "Basculer le thème sombre",
      privacyData: "Confidentialité et Données",
      privacyModeDesc: "Ne pas envoyer de journaux ni synchroniser",
      localHistory: "Historique Local",
      localHistoryDesc: "Enregistrer les prompts sur cet appareil",
      dataManagement: "Gestion des Données",
      confirmClear: "Effacer tous les prompts ?",
      cancel: "Annuler",
      confirmYes: "Oui, Effacer",
      support: "Soutenir le projet",
      donate: "Faire un don",
      donateDesc: "Cet outil est gratuit. Votre soutien aide à couvrir les frais.",
      coffee: "M'offrir un café",
      stripe: "Via Stripe",
      mascot: "Promptly le Bot"
    },
    tutorial: {
      start: "Lancer le Tutoriel",
      next: "Suivant",
      prev: "Préc.",
      finish: "Terminer",
      skip: "Passer",
      steps: {
        welcome: { title: "Bienvenue sur PromptMaster !", content: "Faisons un tour pour maîtriser l'IA. Rencontrez Promptly le Bot en bas ! Cliquez dessus pour une astuce amusante." },
        support: { title: "Soutenir & Donner", content: "L'outil vous est utile ? Cliquez ici pour soutenir le développement." },
        model: { title: "Choisissez votre Modèle", content: "Basculez entre 'Flash' pour la vitesse et 'Pro' pour le raisonnement." },
        task: { title: "Tâche Principale", content: "C'est la partie la plus importante. Décrivez exactement ce que vous voulez." },
        context: { title: "Ajouter du Contexte", content: "Fournissez des contraintes, un contexte ou des détails sur le public ici." },
        templates: { title: "Modèles Rapides", content: "Bloqué ? Cliquez sur l'un d'eux pour remplir le formulaire instantanément." },
        generate: { title: "Générer", content: "Cliquez ici pour créer votre prompt optimisé avec Google Gemini." },
        refinerNav: { title: "Onglet Raffineur", content: "Vous avez déjà un prompt ? Passez ici pour le peaufiner." },
        refinerInput: { title: "Brouillon", content: "Collez votre prompt ou texte brut ici." },
        refinerActions: { title: "Actions Rapides", content: "Utilisez ces boutons pour corriger la grammaire, raccourcir ou optimiser." },
        historyNav: { title: "Historique", content: "Tous vos prompts créés sont enregistrés ici automatiquement." },
        historySearch: { title: "Recherche Intelligente", content: "Filtrez votre historique par mot-clé ou logique ET/OU." },
        settingsNav: { title: "Paramètres", content: "Configurez les thèmes, la confidentialité et gérez vos données." }
      }
    }
  },
  de: {
    appName: "PromptMaster",
    tabs: { generator: "Generator", refiner: "Refiner", history: "Verlauf", settings: "Einst." },
    generator: {
      crafting: "Erstelle...",
      generate: "Prompt Erstellen",
      coreTask: "Ziel / Hauptaufgabe",
      context: "Kontext / Einschränkungen",
      tone: "Ton",
      format: "Format",
      model: "Modell",
      templates: "Schnellvorlagen",
      clear: "Leeren",
      promptStrength: { weak: "Schwach", good: "Gut", strong: "Stark" },
      placeholders: {
        task: "z.B. Marketing-E-Mail schreiben",
        context: "Zielgruppe, Wortanzahl, Stil..."
      }
    },
    refiner: {
      originalPrompt: "Original Prompt",
      refinementActions: "Verfeinerungsaktionen",
      formatOutput: "Ausgabeformat",
      tone: "Ton",
      persona: "Persona",
      customInstruction: "Benutzerdefinierte Anweisung",
      run: "Ausführen",
      loopToInput: "Als Eingabe verwenden",
      clear: "Leeren",
      placeholders: {
        input: "Fügen Sie hier Ihren Entwurf ein...",
        custom: "z.B. 'Auf Deutsch übersetzen'"
      },
      actions: {
        optimize: "Optimieren",
        grammar: "Grammatik",
        simplify: "Vereinfachen",
        shorten: "Kürzen",
        expand: "Erweitern",
        json: "JSON",
        markdown: "Markdown",
        table: "Tabelle"
      }
    },
    common: {
      save: "Speichern",
      copy: "Kopieren",
      copied: "Kopiert",
      result: "Ergebnis",
      search: "Prompts suchen...",
      noSaved: "Keine gespeicherten Prompts.",
      noMatching: "Keine Treffer.",
      savedPrompts: "Gespeicherte Prompts",
      found: "Gefunden",
      sortBy: "Sortieren nach",
      sortDate: "Datum",
      sortName: "Name",
      sortCategory: "Kategorie",
      delete: "Löschen",
      clearHistory: "Verlauf Löschen",
      exportData: "Daten Exportieren (JSON)",
      privacyMode: "Privatmodus",
      online: "Online",
      securityNote: "Sicherheitshinweis",
      securityText: "API-Schlüssel werden sicher behandelt.",
      appearance: "Aussehen",
      darkMode: "Dunkelmodus",
      darkModeDesc: "Dunkles Farbschema umschalten",
      privacyData: "Datenschutz & Daten",
      privacyModeDesc: "Keine Logs oder Synchronisierung",
      localHistory: "Lokaler Verlauf",
      localHistoryDesc: "Prompts auf diesem Gerät speichern",
      dataManagement: "Datenverwaltung",
      confirmClear: "Alle Prompts löschen?",
      cancel: "Abbrechen",
      confirmYes: "Ja, Löschen",
      support: "Entwicklung unterstützen",
      donate: "Spenden",
      donateDesc: "Dieses Tool ist kostenlos. Ihre Unterstützung deckt die Kosten.",
      coffee: "Kaffee spendieren",
      stripe: "Über Stripe",
      mascot: "Promptly der Bot"
    },
    tutorial: {
      start: "Tutorial Starten",
      next: "Weiter",
      prev: "Zurück",
      finish: "Beenden",
      skip: "Überspringen",
      steps: {
        welcome: { title: "Willkommen bei PromptMaster!", content: "Machen wir eine kurze Tour. Triff Promptly den Bot da unten! Klick ihn an für einen lustigen Tipp." },
        support: { title: "Unterstützen & Spenden", content: "Finden Sie das Tool nützlich? Hier klicken, um die Entwicklung zu unterstützen." },
        model: { title: "Wähle dein Modell", content: "Wechsle zwischen 'Flash' für Geschwindigkeit und 'Pro' für komplexe Aufgaben." },
        task: { title: "Hauptaufgabe", content: "Das ist der wichtigste Teil. Beschreibe genau, was die KI tun soll." },
        context: { title: "Kontext Hinzufügen", content: "Gib hier Einschränkungen, Hintergrundinfos oder Zielgruppendetails an." },
        templates: { title: "Schnellvorlagen", content: "Nicht sicher? Klicke hier, um das Formular sofort auszufüllen." },
        generate: { title: "Erstellen", content: "Klicke hier, um deinen optimierten Prompt mit Google Gemini zu erstellen." },
        refinerNav: { title: "Refiner Tab", content: "Hast du schon einen Prompt? Wechsle hierhin, um ihn zu verbessern." },
        refinerInput: { title: "Entwurf", content: "Füge hier deinen Entwurf oder Text ein." },
        refinerActions: { title: "Schnellaktionen", content: "Nutze diese Buttons für Grammatik, Kürzen oder Optimieren." },
        historyNav: { title: "Verlauf", content: "Alle deine erstellten Prompts werden hier automatisch gespeichert." },
        historySearch: { title: "Intelligente Suche", content: "Filtere deinen Verlauf nach Stichworten oder UND/ODER-Logik." },
        settingsNav: { title: "Einstellungen", content: "Konfiguriere Designs, Datenschutz und verwalte deine Daten." }
      }
    }
  },
  ja: {
    appName: "PromptMaster",
    tabs: { generator: "生成", refiner: "改善", history: "履歴", settings: "設定" },
    generator: {
      crafting: "作成中...",
      generate: "プロンプト生成",
      coreTask: "目的 / タスク",
      context: "背景 / 制約",
      tone: "トーン",
      format: "フォーマット",
      model: "モデル",
      templates: "テンプレート",
      clear: "クリア",
      promptStrength: { weak: "弱い", good: "良い", strong: "強い" },
      placeholders: {
        task: "例：マーケティングメールを書く、Reactコードをデバッグ",
        context: "ターゲット、文字数、スタイルの制約..."
      }
    },
    refiner: {
      originalPrompt: "元のプロンプト",
      refinementActions: "改善アクション",
      formatOutput: "出力形式",
      tone: "トーン",
      persona: "ペルソナ",
      customInstruction: "カスタム指示",
      run: "実行",
      loopToInput: "入力に反映",
      clear: "クリア",
      placeholders: {
        input: "ここにプロンプトの下書きを貼り付けてください...",
        custom: "例：'日本語に翻訳して'"
      },
      actions: {
        optimize: "最適化",
        grammar: "文法修正",
        simplify: "単純化",
        shorten: "短縮",
        expand: "拡張",
        json: "JSON",
        markdown: "Markdown",
        table: "表"
      }
    },
    common: {
      save: "保存",
      copy: "コピー",
      copied: "コピー完了",
      result: "結果",
      search: "検索...",
      noSaved: "保存されたプロンプトはありません。",
      noMatching: "見つかりませんでした。",
      savedPrompts: "保存済み",
      found: "件",
      sortBy: "並び替え",
      sortDate: "日付",
      sortName: "名前",
      sortCategory: "カテゴリ",
      delete: "削除",
      clearHistory: "履歴を削除",
      exportData: "データ出力 (JSON)",
      privacyMode: "プライバシーモード",
      online: "オンライン",
      securityNote: "セキュリティについて",
      securityText: "APIキーは安全に管理されています。",
      appearance: "外観",
      darkMode: "ダークモード",
      darkModeDesc: "ダークテーマの切り替え",
      privacyData: "プライバシーとデータ",
      privacyModeDesc: "ログ送信や同期を行いません",
      localHistory: "ローカル履歴",
      localHistoryDesc: "このデバイスにプロンプトを保存",
      dataManagement: "データ管理",
      confirmClear: "すべて削除しますか？",
      cancel: "キャンセル",
      confirmYes: "はい、削除します",
      support: "開発を支援",
      donate: "寄付する",
      donateDesc: "このツールは無料です。寄付は開発とサーバー費用の助けになります。",
      coffee: "コーヒーを奢る",
      stripe: "Stripeで支援",
      mascot: "Promptly"
    },
    tutorial: {
      start: "チュートリアル開始",
      next: "次へ",
      prev: "前へ",
      finish: "終了",
      skip: "スキップ",
      steps: {
        welcome: { title: "PromptMasterへようこそ！", content: "AIプロンプトを使いこなすツアーを始めましょう。右下のPromptlyボットもよろしく！クリックで楽しいヒントがもらえます。" },
        support: { title: "支援と寄付", content: "このツールが役立ちましたか？ここをクリックして開発を支援してください。" },
        model: { title: "モデル選択", content: "速度重視の'Flash'と、複雑な推論向けの'Pro'を切り替えられます。" },
        task: { title: "コアタスク", content: "これが最も重要です。AIに何をさせたいか正確に記述してください。" },
        context: { title: "コンテキスト", content: "制約、背景情報、ターゲットオーディエンスの詳細をここに入力します。" },
        templates: { title: "クイックテンプレート", content: "迷ったらここをクリックして、フォームを即座に入力しましょう。" },
        generate: { title: "生成", content: "ここをクリックして、Google Geminiを使用した最適化プロンプトを作成します。" },
        refinerNav: { title: "改善タブ", content: "既存のプロンプトがありますか？ここで磨きをかけましょう。" },
        refinerInput: { title: "下書き入力", content: "ここに下書きやテキストを貼り付けてください。" },
        refinerActions: { title: "クイックアクション", content: "文法修正、短縮、最適化などのボタンで即座に改善できます。" },
        historyNav: { title: "履歴", content: "作成したすべてのプロンプトは自動的にここに保存されます。" },
        historySearch: { title: "スマート検索", content: "キーワードやAND/ORロジックで履歴をフィルタリングできます。" },
        settingsNav: { title: "設定", content: "テーマ、プライバシー、データ管理を設定できます。" }
      }
    }
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

export const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('prompt_master_language');
    if (saved && Object.keys(translations).includes(saved)) {
      setLanguage(saved as Language);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('prompt_master_language', lang);
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        return path; // Fallback to key if not found
      }
    }
    return typeof current === 'string' ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
