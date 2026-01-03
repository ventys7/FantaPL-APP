const sdk = require('node-appwrite');

// Appwrite Cloud Functions - uses process.env for environment variables

module.exports = async ({ req, res, log, error }) => {
    const client = new sdk.Client();
    const users = new sdk.Users(client);
    const databases = new sdk.Databases(client);

    // 1. Initialize Client with Function Environment Variables from process.env
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT;
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !apiKey || !projectId) {
        error('Missing Environment Variables: APPWRITE_FUNCTION_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, or APPWRITE_API_KEY');
        return res.json({ success: false, error: 'Misconfigured Function (Missing Variables)' }, 500);
    }

    client
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    try {
        // Parse the body - in new format it's req.body (string) or req.bodyJson (object)
        let payload;
        if (typeof req.body === 'string' && req.body) {
            payload = JSON.parse(req.body);
        } else if (req.bodyJson) {
            payload = req.bodyJson;
        } else {
            return res.json({ success: false, error: 'Empty or invalid request body' }, 400);
        }

        const { userId, newPassword, adminId } = payload;

        if (!userId || !newPassword || !adminId) {
            return res.json({ success: false, error: 'Missing userId, newPassword, or adminId' }, 400);
        }

        // 2. Security Check: Verify the caller is actually an Admin
        // Use 'req.headers["x-appwrite-user-id"]' which is injected by Appwrite if invoked with session.
        const callerId = req.headers['x-appwrite-user-id'];

        if (!callerId) {
            error('No user session found in request headers');
            return res.json({ success: false, error: 'Unauthorized: No User Session' }, 401);
        }

        // Fetch caller profile from Database to check role (Source of Truth)
        const DB_ID = 'fantapl_db';
        const COLL_FANTASY_TEAMS = 'fantasy_teams';

        log(`[DEBUG] Verifying Admin Role for Client ID: ${callerId}`);
        log(`[DEBUG] Querying DB: ${DB_ID}, Collection: ${COLL_FANTASY_TEAMS}`);

        try {
            const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                sdk.Query.equal('user_id', callerId)
            ]);

            log(`[DEBUG] Database Response. Total documents: ${response.total}`);

            const userDoc = response.documents[0];

            if (userDoc) {
                log(`[DEBUG] User Document Found. ID: ${userDoc.$id}, Role: '${userDoc.role}', Name: '${userDoc.manager_name}'`);
            } else {
                log(`[DEBUG] No User Document found for user_id: ${callerId}`);
            }

            if (!userDoc || userDoc.role !== 'admin') {
                error(`Unauthorized password reset attempt by ${callerId}. Role found: ${userDoc ? userDoc.role : 'None'}`);
                return res.json({ success: false, error: `Unauthorized: Admin privileges required. Found role: '${userDoc ? userDoc.role : 'None'}'` }, 403);
            }

            log('[DEBUG] Admin role verified successfully.');

        } catch (dbError) {
            error(`Database validation failed for ${callerId}: ${dbError.message}`);
            return res.json({ success: false, error: 'Security check failed: Could not verify user role' }, 500);
        }

        // 3. Update the Target User's Password
        await users.updatePassword(userId, newPassword);

        log(`Password reset for user ${userId} by admin ${callerId}`);
        return res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        error('Error executing function: ' + err.message);
        return res.json({ success: false, error: err.message }, 500);
    }
};

