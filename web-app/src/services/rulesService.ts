import { databases, DB_ID, COLL_SETTINGS } from '../lib/appwrite';
import { Query } from 'appwrite';

export interface AppRule {
    $id?: string;
    key: string;
    value: any; // Stored as string in Appwrite usually, need parsing
    description: string;
}

export const RulesService = {
    async getAllRules() {
        // Fetch all rules
        const response = await databases.listDocuments(DB_ID, COLL_SETTINGS, [
            Query.limit(100)
        ]);

        // Parse values (since we stored them as strings in setup usually, or simplistic types)
        return response.documents.map(doc => ({
            ...doc,
            value: parseValue(doc.value) // @ts-ignore
        })) as unknown as AppRule[];
    },

    async updateRule(key: string, newValue: any) {
        // 1. Find the document ID by key
        const list = await databases.listDocuments(DB_ID, COLL_SETTINGS, [
            Query.equal('key', key)
        ]);

        if (list.documents.length === 0) throw new Error(`Rule ${key} not found`);
        const docId = list.documents[0].$id;

        // 2. Update
        await databases.updateDocument(DB_ID, COLL_SETTINGS, docId, {
            value: String(newValue)
        });
    },

    async getRuleValue(key: string) {
        const list = await databases.listDocuments(DB_ID, COLL_SETTINGS, [
            Query.equal('key', key)
        ]);
        if (list.documents.length === 0) return null;
        return parseValue(list.documents[0].value);
    }
};

function parseValue(val: string) {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val))) return Number(val);
    return val;
}
