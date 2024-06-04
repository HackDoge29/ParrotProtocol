import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import './App.css';
import logo from './logo.svg';

const onboard = Onboard({
  wallets: [injectedModule()],
  chains: [
    {
      id: '0x61',
      token: 'BNB',
      label: 'BNB Chain Testnet',
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    }
  ]
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [contents, setContents] = useState([]);
  const [uri, setUri] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    const connectWallet = async () => {
      const wallets = await onboard.connectWallet();
      if (wallets[0]) {
        const ethersProvider = new ethers.providers.Web3Provider(wallets[0].provider);
        setProvider(ethersProvider);
        const signer = ethersProvider.getSigner();
        setSigner(signer);
        const userAccount = await signer.getAddress();
        setAccount(userAccount);

        const userBalance = await ethersProvider.getBalance(userAccount);
        setBalance(ethers.utils.formatEther(userBalance));
      }
    };

    connectWallet();
  }, []);

  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('No signer available');
    }
    return await signer.signMessage(message);
  };

  const handleCreateContent = async () => {
    const message = `Create content: ${uri} with price ${price}`;
    const signature = await signMessage(message);
    const response = await axios.post(`${BACKEND_URL}/createContent`, {
      uri,
      price,
      signature,
      address: account
    });
    console.log(response.data);
    loadContents();
    setUri('');
    setPrice('');
  };

  const handlePurchaseContent = async (id, contentPrice) => {
    const message = `Purchase content ID: ${id} with price ${contentPrice}`;
    const signature = await signMessage(message);
    const response = await axios.post(`${BACKEND_URL}/purchaseContent`, {
      id,
      value: contentPrice,
      signature,
      address: account
    });
    console.log(response.data);
    loadContents();
  };

  const handleVote = async (id) => {
    const message = `Vote for content ID: ${id}`;
    const signature = await signMessage(message);
    const response = await axios.post(`${BACKEND_URL}/vote`, {
      id,
      signature,
      address: account
    });
    console.log(response.data);
    loadContents();
  };

  const loadContents = async () => {
    const response = await axios.get(`${BACKEND_URL}/getActiveContent`);
    setContents(response.data);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Parrot Protocol Logo" className="App-logo" />
        <h1>Parrot Protocol</h1>
        <button onClick={() => onboard.connectWallet()}>Connect Wallet</button>
        {account && <p>Connected Account: {account}</p>}
        {balance && <p>Balance: {balance} BNB</p>}
      </header>
      <main>
        <div className="create-content">
          <input
            type="text"
            placeholder="Content URI"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
          />
          <input
            type="number"
            placeholder="Price in BNB"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button onClick={handleCreateContent}>Create Content</button>
        </div>
        <div className="content-list">
          <h2>Active Content</h2>
          {contents.map((content) => (
            <div key={content.id} className="content-item">
              <p>URI: {content.uri}</p>
              <p>Price: {ethers.utils.formatEther(content.price)} BNB</p>
              <p>Votes: {content.votes}</p>
              <button onClick={() => handlePurchaseContent(content.id, ethers.utils.formatEther(content.price))}>Purchase</button>
              <button onClick={() => handleVote(content.id)}>Vote</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
