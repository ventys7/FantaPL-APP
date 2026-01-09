export interface Section {
    id: number;
    title: string;
    key: string;
    content: string;
}

export interface ArchivedRules {
    $id: string;
    season: string;
    archived_at: string;
    cenni_main_text: string;
    cenni_partecipanti: string;
    sections_json: string;
}

export interface CenniPrincipali {
    title?: string;
    subtitle?: string;
    mainText: string;
    partecipanti: string;
}
