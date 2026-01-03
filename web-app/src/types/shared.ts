export interface AppwriteDocument {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $collectionId: string;
    $databaseId: string;
}

export type UserRole = 'admin' | 'helper' | 'user';

export interface User {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    name: string;
    email: string;
    phone: string;
    emailVerification: boolean;
    phoneVerification: boolean;
    status: boolean;
    labels: string[];
    prefs: {
        role?: UserRole;
        teamId?: string;
        avatar?: string;
        force_pass_reset?: boolean;
        hidden?: boolean;
    };
}
