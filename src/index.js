import { pollingIntervalIds } from './config.js';
import { getHoldings} from './helpers.js';
import { buySneiper } from './buy-sneiper.js';
import { mintSneiper } from './mint-sneiper.js';
import { restoreWallet } from "@sei-js/core";
import { getSigningCosmWasmClient } from "@sei-js/core";


async function main() {
    try {    
        // Restore wallet
        const restoredWallet = await restoreWallet(process.env.RECOVERY_PHRASE);
        // Get accounts
        const accounts = await restoredWallet.getAccounts();
        // Get sender address
        const senderAddress = accounts[0].address;
        const signingCosmWasmClient = await getSigningCosmWasmClient(process.env.RPC_URL, restoredWallet, {gasPrice: process.env.GAS_LIMIT + "usei"});
        // Handle different modes
        if(process.env.MODE === 'MINT'){
            console.log("Sneiper in MINT mode");
            //console.log("Checking if you hold any FrankenFrens...");
            //const isHolder = await getHoldings(senderAddress, signingCosmWasmClient);
            let needsToPayFee = false;
            /*if(isHolder >= 5){
                console.log("You hold at least 5 FrankenFrens so you will not be charged any fees for every successful mint!");
                needsToPayFee = false;
            } else {
                console.log("You do not hold at least 5 FrankenFrens so a fee of 0.1 SEI will be charged for every successful mint!");
            }*/
            const pollingFrequency = parseFloat(process.env.POLLING_FREQUENCY) * 1000;
            if (!isNaN(pollingFrequency) && pollingFrequency > 0) {
                const intervalId = setInterval(() => mintSneiper(senderAddress, needsToPayFee, signingCosmWasmClient), pollingFrequency);
                pollingIntervalIds.push(intervalId);
            } else {
                console.error("Invalid POLLING_FREQUENCY. Please set a valid number in seconds");
            }
        } else if (process.env.MODE === "BUY"){
            console.log("Sneiper in BUY mode:" 
             + "\nwith contract address: " + process.env.CONTRACT_ADDRESS 
             + "\nwith token id: " + process.env.TOKEN_ID 
             + "\nwith buy limit: " + process.env.BUY_LIMIT 
             + "\nwith price limit: " + process.env.PRICE_LIMIT 
             + "\nwith gas limit: " + process.env.GAS_LIMIT 
             + "\nwith polling frequency: " + process.env.POLLING_FREQUENCY
            );
            console.log("\nSneiper watching marketplace listings...");
            const pollingFrequency = parseFloat(process.env.POLLING_FREQUENCY) * 1000;
            if (!isNaN(pollingFrequency) && pollingFrequency > 0) {
                const intervalId = setInterval(() => buySneiper(senderAddress, signingCosmWasmClient), pollingFrequency);
                pollingIntervalIds.push(intervalId);
            } else {
                console.error("Invalid POLLING_FREQUENCY. Please set a valid number in seconds");
            }
        } else {
            console.log("Invalid MODE! Try BUY or MINT");
        }
    } catch (error) {
        console.error("Error: " + error.message);
    }
}

main();
