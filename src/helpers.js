import { pollingIntervalIds } from './config.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {keccak_256} from '@noble/hashes/sha3';

const basePath = "static/js"

export function isValidListing(palletListingResponseData) {
    if (palletListingResponseData.tokens[0].auction == null || 
        palletListingResponseData.tokens[0].auction.type !== "fixed_price" || 
        palletListingResponseData.tokens[0].auction.price_float > process.env.PRICE_LIMIT) {
        return false;
    } else {
        return true;
    }
}

export function clearAllIntervals() {
    pollingIntervalIds.forEach((id) => clearInterval(id));
}

export async function getHoldings(address, signingCosmWasmClient) {
    try {
        
        let tokensHeld = await signingCosmWasmClient.queryContractSmart("sei1fxhhxflcxpaexwtu8rsuz3xjd9nzsnxy6uqkz55lare3ev2cc5ws2zdcnr", {
            tokens: {
                owner: address
            }
        });

        console.log("You hold " + tokensHeld.tokens.length + " FrankenFrens.");
        return tokensHeld.tokens.length;
    } catch (error) {
        console.error("Error checking if FrankenFrens holder:", error);
        return 0;
    }
}

export async function getCollectionConfig(collectionAddress, signingCosmWasmClient) {
    try {
        let collectionConfig = await signingCosmWasmClient.queryContractSmart("sei1hjsqrfdg2hvwl3gacg4fkznurf36usrv7rkzkyh29wz3guuzeh0snslz7d", {
            get_collection: {
                collection: collectionAddress
            }
        });
        return collectionConfig;
    } catch (error) {
        console.error("Error checking collection config: ", error);
        return null;
    }
}

export function getHashedAddress(address){
    const hashedAddress = Array.from(Buffer.from(keccak_256(address)))
    return hashedAddress;
}

export async function getMintDetailsFromUrl(url){
    const htmlData = await getMintSiteHtml(url);
    if (htmlData) {
        const $ = cheerio.load(htmlData);
        const scripts = $('script[src]').toArray();
        for (const element of scripts) {
            const src = $(element).attr('src');
            if (src && src.includes(basePath)) {
                return await getMintDetails(url, src); 
            }
        }
    }
};


async function getMintSiteHtml(url){
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching HTML from ${url}: ${error}`);
        return null;
    }
};

async function getMintDetails (url, src){
    try {
        const fullUrl = src.startsWith('http') ? src : `${url}${src}`;
        const { data: jsContent } = await axios.get(fullUrl);
        const mintDetails = findMintDetails(jsContent);
        return mintDetails
    } catch (error) {
        console.error(`Failed to process ${src}: ${error.message}`);
        return null;
    }
};


function findMintDetails(jsContent){
    const regex = /const r=JSON\.parse\('((?:\\.|[^'\\])*)'\)/;
    const match = jsContent.match(regex);
    if (match && match.length > 1) {
        const jsonString = match[1].replace(/\\'/g, "'");
        try {
            const jsonObject = JSON.parse(jsonString);
            return jsonObject;
        } catch (error) {
            console.error("Error parsing mint details string:", error);
            return null;
        }
    } else {
        console.log("Mint details not found!");
        return null;
    }
};




