import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Head from "next/head";

const FACTORY_ADDRESS = "0xD6FCbb93Af0dBE96A7eBFA0d869b0aB38135A76c";

const factoryABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "marketAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "question",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    name: "MarketCreated",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "allMarkets",
    outputs: [
      { internalType: "contract PredictionMarket", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "string", name: "_question", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
    ],
    name: "createMarket",
    outputs: [{ internalType: "address", name: "market", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "factoryOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getMarket",
    outputs: [
      { internalType: "contract PredictionMarket", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const marketABI = [
  "function owner() view returns (address)",
  "function marketQuestion() view returns (string)",
  "function marketDescription() view returns (string)",
  "function initialized() view returns (bool)",
  "function yesPool() view returns (uint256)",
  "function noPool() view returns (uint256)",
  "function initializeMarket() external payable",
  "function buyYes(uint256 minYesOut) external payable",
  "function buyNo(uint256 minNoOut) external payable",
  "function sellYes(uint256 yesAmount, uint256 minEthOut) external",
  "function sellNo(uint256 noAmount, uint256 minEthOut) external",
  "function resolveMarket(bool _outcomeYes) external",
  "function redeem() external",
  "function marketResolved() view returns (bool)",
  "function outcomeYes() view returns (bool)",
  "function getYesBalance(address user) external view returns (uint256)",
  "function getNoBalance(address user) external view returns (uint256)",
];

function MarketDetails({ market, account }) {
  const [initialCollateral, setInitialCollateral] = useState("");

  const [buyAmount, setBuyAmount] = useState("");
  const [resolveOutcome, setResolveOutcome] = useState("yes");

  const [activeTab, setActiveTab] = useState("buy");
  const [selectedOutcome, setSelectedOutcome] = useState("yes");

  // NEW OR MODIFIED: state for user balances and selling
  const [yesBalance, setYesBalance] = useState("0");
  const [noBalance, setNoBalance] = useState("0");
  const [sellYesAmount, setSellYesAmount] = useState("");
  const [sellNoAmount, setSellNoAmount] = useState("");

  useEffect(() => {
    if (account && market.address) {
      fetchUserBalances();
    }
  }, [account, market.address]);

  async function fetchUserBalances() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(market.address, marketABI, provider);

    const yBal = await contract.getYesBalance(account);
    const nBal = await contract.getNoBalance(account);

    setYesBalance(yBal.toString());
    setNoBalance(nBal.toString());
  }

  function computePercentages(yesPool, noPool) {
    const yes = BigInt(yesPool);
    const no = BigInt(noPool);
    const total = yes + no;
    if (total === 0n) return { yesPercent: 50, noPercent: 50 };
    const yesPercent = Number((yes * 100n) / total);
    const noPercent = 100 - yesPercent;
    return { yesPercent, noPercent };
  }

  const { yesPercent, noPercent } = computePercentages(
    market.yesPool,
    market.noPool
  );

  async function initializeMarketFunc() {
    if (!market.address || !initialCollateral) return;
    if (account.toLowerCase() !== market.owner.toLowerCase()) {
      alert("Only the owner can initialize the market!");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    try {
      const tx = await contract.initializeMarket({
        value: ethers.parseEther(initialCollateral),
      });
      alert("Initializing market, please wait...");
      await tx.wait();
      alert("Market initialized!");
    } catch (err) {
      console.error(err);
      alert("Error initializing market: " + (err.message || err.toString()));
    }
  }

  async function buyYesTokens() {
    if (!market.address || !buyAmount) return;
    if (!market.initialized) {
      alert("Market not initialized yet!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    try {
      const tx = await contract.buyYes(1, {
        value: ethers.parseEther(buyAmount),
      });
      await tx.wait();
      alert("Bought YES tokens!");
      fetchUserBalances();
    } catch (err) {
      console.error(err);
      alert("Error buying YES tokens: " + (err.message || err.toString()));
    }
  }

  async function buyNoTokens() {
    if (!market.address || !buyAmount) return;
    if (!market.initialized) {
      alert("Market not initialized yet!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    try {
      const tx = await contract.buyNo(1, {
        value: ethers.parseEther(buyAmount),
      });
      await tx.wait();
      alert("Bought NO tokens!");
      fetchUserBalances();
    } catch (err) {
      console.error(err);
      alert("Error buying NO tokens: " + (err.message || err.toString()));
    }
  }

  async function sellYesTokens() {
    if (!market.address || !sellYesAmount) return;
    if (!market.initialized) {
      alert("Market not initialized yet!");
      return;
    }
    if (BigInt(sellYesAmount) > BigInt(yesBalance)) {
      alert("You don't have that many YES tokens!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    try {
      const tx = await contract.sellYes(ethers.toBigInt(sellYesAmount), 1);
      await tx.wait();
      alert("Sold YES tokens!");
      fetchUserBalances();
    } catch (err) {
      console.error(err);
      alert("Error selling YES tokens: " + (err.message || err.toString()));
    }
  }

  async function sellNoTokens() {
    if (!market.address || !sellNoAmount) return;
    if (!market.initialized) {
      alert("Market not initialized yet!");
      return;
    }
    if (BigInt(sellNoAmount) > BigInt(noBalance)) {
      alert("You don't have that many NO tokens!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    try {
      const tx = await contract.sellNo(ethers.toBigInt(sellNoAmount), 1);
      await tx.wait();
      alert("Sold NO tokens!");
      fetchUserBalances();
    } catch (err) {
      console.error(err);
      alert("Error selling NO tokens: " + (err.message || err.toString()));
    }
  }

  async function resolveMarketFunc() {
    if (!market.address) return;
    if (account.toLowerCase() !== market.owner.toLowerCase()) {
      alert("Only the owner can resolve the market!");
      return;
    }
    if (!market.initialized) {
      alert("Market must be initialized first!");
      return;
    }
    if (market.resolved) {
      alert("Market is already resolved!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    const outcomeBool = resolveOutcome === "yes";

    try {
      const tx = await contract.resolveMarket(outcomeBool);
      alert("Resolving market, please wait...");
      await tx.wait();
      alert("Market resolved!");
    } catch (err) {
      console.error(err);
      alert("Error resolving market: " + (err.message || err.toString()));
    }
  }

  async function redeemFunc() {
    if (!market.address) return;
    if (!market.resolved) {
      alert("Market is not resolved yet!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(market.address, marketABI, signer);

    try {
      const tx = await contract.redeem();
      alert("Redeeming your share, please wait...");
      await tx.wait();
      alert("Redeemed successfully!");
      fetchUserBalances();
    } catch (err) {
      console.error(err);
      alert("Error redeeming: " + (err.message || err.toString()));
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      {/* Market Heading */}
      <p className="text-xs break-all italic text-gray-400">{market.address}</p>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold font-mono">{market.question}</h2>
          {market.resolved && (
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
              RESOLVED
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{market.description}</p>
      </div>

      {/* Market Stats */}
      {market.initialized && (
        <div className="mb-4">
          <div className="text-gray-600">
            <span className="font-semibold">Volume {market.balance} ETH</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-5xl font-bold text-green-900">
                {yesPercent}%
              </span>
              <span className="">Chance</span>
            </div>
          </div>
        </div>
      )}

      {/* Not Initialized Info */}
      {!market.initialized &&
        account &&
        account.toLowerCase() !== market.owner.toLowerCase() && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4 text-sm italic text-gray-600">
            The creator of this market has not yet provided liquidity.
          </div>
        )}

      {/* Initialize Market Section */}
      {!market.initialized &&
        account &&
        account.toLowerCase() === market.owner.toLowerCase() && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4">
            <h3 className="text-lg font-semibold mb-3">Initialize Market</h3>
            <input
              className="w-full p-2 border border-gray-300 rounded mb-3"
              placeholder="Initial Collateral (ETH)"
              value={initialCollateral}
              onChange={(e) => setInitialCollateral(e.target.value)}
            />
            <button
              onClick={initializeMarketFunc}
              className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800 font-semibold"
            >
              Initialize Market
            </button>
          </div>
        )}

      {/* Buy / Sell Section */}
      {market.initialized && !market.resolved && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4 max-w-sm">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
            <div className="flex space-x-6">
              <button
                className={`text-sm font-bold pb-1 ${
                  activeTab === "buy"
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-black"
                }`}
                onClick={() => setActiveTab("buy")}
              >
                Buy
              </button>
              <button
                className={`text-sm font-bold pb-1 ${
                  activeTab === "sell" && (yesBalance > 0 || noBalance > 0)
                    ? "text-black border-b-2 border-black"
                    : yesBalance > 0 || noBalance > 0
                    ? "text-gray-500 hover:text-black"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (yesBalance > 0 || noBalance > 0) setActiveTab("sell");
                }}
                disabled={!(yesBalance > 0 || noBalance > 0)}
              >
                Sell
              </button>
            </div>
          </div>

          {/* BUY TAB */}
          {activeTab === "buy" && (
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Outcome
              </label>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setSelectedOutcome("yes")}
                  className={`px-3 py-2 rounded border ${
                    selectedOutcome === "yes"
                      ? "border-gray-400 bg-green-100 text-green-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-green-50"
                  }`}
                >
                  YES {yesPercent}¢
                </button>
                <button
                  onClick={() => setSelectedOutcome("no")}
                  className={`px-3 py-2 rounded border ${
                    selectedOutcome === "no"
                      ? "border-gray-400 bg-red-100 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-red-50"
                  }`}
                >
                  NO {noPercent}¢
                </button>
              </div>

              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Amount (ETH)
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded mb-4"
                placeholder="ETH amount"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
              />

              <button
                onClick={() =>
                  selectedOutcome === "yes" ? buyYesTokens() : buyNoTokens()
                }
                className={`w-full px-4 py-2 rounded text-white font-semibold ${
                  selectedOutcome === "yes"
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Buy {selectedOutcome.toUpperCase()}
              </button>
            </div>
          )}

          {/* SELL TAB */}
          {activeTab === "sell" && (yesBalance > 0 || noBalance > 0) && (
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Outcome
              </label>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setSelectedOutcome("yes")}
                  className={`px-3 py-2 rounded border ${
                    selectedOutcome === "yes"
                      ? "border-gray-400 bg-green-100 text-green-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-green-50"
                  }`}
                  disabled={yesBalance <= 0}
                >
                  YES {yesPercent}¢
                </button>
                <button
                  onClick={() => setSelectedOutcome("no")}
                  className={`px-3 py-2 rounded border ${
                    selectedOutcome === "no"
                      ? "border-gray-400 bg-red-100 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-red-50"
                  }`}
                  disabled={noBalance <= 0}
                >
                  NO {noPercent}¢
                </button>
              </div>

              {selectedOutcome === "yes" && yesBalance > 0 && (
                <>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Amount (YES)
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Current Balance:{" "}
                    <span className="font-bold">
                      {(Number(yesBalance) / 1e18).toFixed(4)}
                    </span>
                  </p>
                  <input
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    placeholder="YES amount"
                    value={sellYesAmount}
                    onChange={(e) => setSellYesAmount(e.target.value)}
                  />

                  <button
                    onClick={sellYesTokens}
                    className="w-full px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600 font-semibold"
                  >
                    Sell YES
                  </button>
                </>
              )}

              {selectedOutcome === "no" && noBalance > 0 && (
                <>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Amount (NO)
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Current Balance:{" "}
                    <span className="font-bold">
                      {(Number(noBalance) / 1e18).toFixed(4)}
                    </span>
                  </p>
                  <input
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    placeholder="NO amount"
                    value={sellNoAmount}
                    onChange={(e) => setSellNoAmount(e.target.value)}
                  />

                  <button
                    onClick={sellNoTokens}
                    className="w-full px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 font-semibold"
                  >
                    Sell NO
                  </button>
                </>
              )}

              {(selectedOutcome === "yes" && yesBalance === "0") ||
              (selectedOutcome === "no" && noBalance === "0") ? (
                <p className="text-sm text-gray-500">
                  You have no {selectedOutcome.toUpperCase()} tokens to sell.
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Resolve Market (Owner Only) */}
      {market.initialized &&
        !market.resolved &&
        account &&
        account.toLowerCase() === market.owner.toLowerCase() && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4">
            <h3 className="text-lg font-semibold mb-2">Resolve Market</h3>
            <p className="mb-2 text-sm text-gray-700">
              Select the winning outcome:
            </p>
            <div className="flex space-x-4 mb-4 text-sm text-gray-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`resolveOutcome_${market.address}`}
                  value="yes"
                  checked={resolveOutcome === "yes"}
                  onChange={(e) => setResolveOutcome(e.target.value)}
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`resolveOutcome_${market.address}`}
                  value="no"
                  checked={resolveOutcome === "no"}
                  onChange={(e) => setResolveOutcome(e.target.value)}
                />
                <span>No</span>
              </label>
            </div>
            <button
              onClick={resolveMarketFunc}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 font-semibold"
            >
              Resolve Market
            </button>
          </div>
        )}

      {/* Redeem Section */}
      {market.resolved && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4">
          <h3 className="text-lg font-semibold mb-2">Redeem</h3>
          <p className="mb-4 text-sm text-gray-700">
            The market has been resolved. If you hold the winning tokens, you
            can redeem your share of the collateral.
          </p>
          <button
            onClick={redeemFunc}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 font-semibold"
          >
            Redeem
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        This market was created by {market.owner.toLowerCase()}{" "}
        {market.owner.toLowerCase() === account?.toLowerCase() && <>(You)</>}
      </p>
    </div>
  );
}

export default function Home() {
  const [account, setAccount] = useState(null);
  const [marketsCount, setMarketsCount] = useState(null);
  const [marketsData, setMarketsData] = useState([]);

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } else {
      alert("No wallet found. Please install one.");
    }
  }

  useEffect(() => {
    if (account) {
      getMarketsCountFunc();
    }
  }, [account]);

  async function getMarketsCountFunc() {
    if (!account) {
      alert("Connect your wallet first!");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    const count = await contract.getMarketsCount();

    const allMarkets = [];
    for (let i = 0; i < count; i++) {
      const marketAddress = await contract.getMarket(i);
      const marketDetails = await loadMarketDetails(marketAddress);
      if (!marketDetails.resolved || marketDetails.balance > 0.0001) {
        allMarkets.push(marketDetails);
      }
    }

    setMarketsCount(allMarkets.length);

    setMarketsData(allMarkets);
  }

  async function loadMarketDetails(marketAddress) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(marketAddress, marketABI, provider);

    const q = await contract.marketQuestion();
    const d = await contract.marketDescription();
    const o = await contract.owner();
    const init = await contract.initialized();
    const yPool = await contract.yesPool();
    const nPool = await contract.noPool();
    const resolved = await contract.marketResolved();
    const outcome = resolved ? await contract.outcomeYes() : false;

    const balanceWei = await provider.getBalance(marketAddress);
    const balance = ethers.formatEther(balanceWei);

    let calculatedYesPrice = "0";
    let calculatedNoPrice = "0";
    if (yPool > 0 && nPool > 0) {
      const yesP = (BigInt(nPool) * 1_000_000_000_000_000_000n) / BigInt(yPool);
      const noP = (BigInt(yPool) * 1_000_000_000_000_000_000n) / BigInt(nPool);

      calculatedYesPrice = ethers.formatEther(yesP);
      calculatedNoPrice = ethers.formatEther(noP);
    }

    return {
      address: marketAddress,
      question: q,
      description: d,
      owner: o,
      initialized: init,
      resolved: resolved,
      outcomeYes: outcome,
      yesPool: yPool.toString(),
      noPool: nPool.toString(),
      yesPrice: calculatedYesPrice,
      noPrice: calculatedNoPrice,
      balance: balance,
    };
  }

  async function createNewMarket() {
    if (!account) {
      alert("Connect your wallet first!");
      return;
    }
    if (!question.trim() || !description.trim()) {
      alert("Please fill in question and description.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);

    try {
      const tx = await contract.createMarket(account, question, description);
      setQuestion("");
      setDescription("");
      alert("Transaction submitted! Waiting for confirmation...");
      await tx.wait();
      alert("Market created successfully!");
      getMarketsCountFunc();
    } catch (error) {
      console.error(error);
      alert("Error creating market: " + (error.message || error.toString()));
    }
  }

  return (
    <>
      <Head>
        <title>Prediction Market Builder</title>
      </Head>
      <div className="min-h-screen p-6 text-gray-800 font-mono">
        <div className="max-w-5xl mx-auto">
          <a
            className="text-green-800 hover:underline"
            target="_blank"
            href="https://sepolia.basescan.org/address/0xD6FCbb93Af0dBE96A7eBFA0d869b0aB38135A76c"
          >
            view the contract on basescan
          </a>
          <div className="flex mb-6 justify-between">
            <div>
              <h1 className="text-3xl font-bold">Prediction Market Builder</h1>
              <a
                className="text-green-800 hover:underline"
                target="_blank"
                href="https://docs.base.org/docs/tools/network-faucets/"
              >
                get sepolia base ETH here
              </a>
            </div>

            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
            >
              {account ? (
                <>
                  Connected:{" "}
                  <span className="font-bold">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>

          {/* Create Market Section */}
          <div className="bg-zinc-100 p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Create a New Market</h2>
            <input
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Market Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <input
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Market Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              onClick={createNewMarket}
              className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
            >
              Create Market
            </button>
          </div>

          {/* Display All Markets */}
          {marketsData.map((m, idx) => (
            <MarketDetails key={idx} market={m} account={account} />
          ))}
        </div>
      </div>
    </>
  );
}
