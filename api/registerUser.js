const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const getCCP = require('./ccp');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccp = getCCP(process.env.ORG);

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.'+process.env.ORG+'.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(process.env.USR);
        if (userIdentity) {
            console.log('An identity for the user "user1" already exists in the wallet');
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
            affiliation: process.env.ORG+'.department1',
            enrollmentID: process.env.USR,
            role: 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: process.env.USR,
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
        await wallet.put(process.env.USR, x509Identity);
        console.log('Successfully registered and enrolled admin user "user1" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "user1": ${error}`);
        process.exit(1);
    }
}

main();
