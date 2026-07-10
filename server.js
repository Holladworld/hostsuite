import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
    },
}));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from a 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * API Endpoint: Handle Client Provisioning & Webhook Syncing
 * This route is triggered immediately after a payment confirmation or account setup request
 */
app.post('/api/v1/provision', async (req, res) => {
    const { clientEmail, domainName, selectedPackage, clientName } = req.body;

    // Strict input validation
    if (!clientEmail || !domainName || !selectedPackage) {
        return res.status(400).json({ 
            success: false, 
            message: "Missing critical onboarding information: clientEmail, domainName, or selectedPackage." 
        });
    }

    try {
        // 1. Database Hook: Log the initial transaction/client request to your DB here
        // (e.g., await supabase.from('clients').insert([...]))

        // 2. Control Panel API Direct Call (Example structure for DirectAdmin/WHM API)
        // We wrap this securely so your master reseller authentication keys never touch the client frontend.
        const panelResponse = await axios.post(`${process.env.RESELLER_PANEL_URL}/api/account/create`, {
            username: clientName ? clientName.toLowerCase().replace(/\s+/g, '') : domainName.split('.')[0],
            email: clientEmail,
            domain: domainName,
            package: selectedPackage, // Matches 'Starter Kit' or 'Managed Growth' packages on the server
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.RESELLER_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // 3. Success Lifecycle Loop
        return res.status(201).json({
            success: true,
            message: "Account provisioning sequence successfully initialized.",
            data: panelResponse.data
        });

    } catch (error) {
        console.error('PROVISIONING_ERROR:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred inside the control panel configuration layer.",
            error: error.message
        });
    }
});

// Fallback Route: Direct all unmatched traffic to the frontend landing page
// Express 5 named catch-all parameter syntax
app.get('/:catchall', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[Vobels HostSuite] Server running securely on port ${PORT}`);
});