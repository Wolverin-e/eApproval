const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const getCCP = require('./ccp');
const path = require('path');

async function register(username, org) {
    try {
        // load the network configuration
        const ccp = getCCP(org);

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.'+org+'.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
            console.log('An identity for the user '+username+' already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: org+'.department1',
            enrollmentID: username,
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: process.env.MSP,
            type: 'X.509',
        };
        await wallet.put(username, x509Identity);
        console.log('Successfully registered and enrolled admin user '+username+' and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user ${username}: ${error}`);
        throw error;
    }
}

module.exports = register;