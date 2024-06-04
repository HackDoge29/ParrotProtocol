const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the CORS package
const { ethers } = require('ethers');
const ParrotProtocol = require('./artifacts/ParrotProtocol.json');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use the CORS middleware
const CONTRACT_ADDRESS='0x05BdeE78E712935801916270925EAe29567f91a9'

const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ParrotProtocol.abi, provider);


app.post('/createContent', async (req, res) => {
    try {
        const { uri, price, signature, address } = req.body;
        const parsedPrice = ethers.utils.parseEther(price);

        const nonce = await provider.getTransactionCount(address, 'latest');
        const tx = {
            to: contract.address,
            value: 0,
            nonce: nonce,
            gasLimit: 1000000,
            data: contract.interface.encodeFunctionData('createContent', [uri, parsedPrice])
        };

        const signedTx = await provider.sendTransaction(tx, signature);
        await signedTx.wait();
        res.send(signedTx);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/purchaseContent', async (req, res) => {
    try {
        const { id, value, signature, address } = req.body;
        const parsedValue = ethers.utils.parseEther(value);

        const nonce = await provider.getTransactionCount(address, 'latest');
        const tx = {
            to: contract.address,
            value: parsedValue,
            nonce: nonce,
            gasLimit: 1000000,
            data: contract.interface.encodeFunctionData('purchaseContent', [id])
        };

        const signedTx = await provider.sendTransaction(tx, signature);
        await signedTx.wait();
        res.send(signedTx);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/vote', async (req, res) => {
    try {
        const { id, signature, address } = req.body;

        const nonce = await provider.getTransactionCount(address, 'latest');
        const tx = {
            to: contract.address,
            value: 0,
            nonce: nonce,
            gasLimit: 1000000,
            data: contract.interface.encodeFunctionData('vote', [id])
        };

        const signedTx = await provider.sendTransaction(tx, signature);
        await signedTx.wait();
        res.send(signedTx);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});