import { useAccount, useBalance } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { IDRX, USDC } from '../constant/smartContract';
import { CryptoAsset } from '../types/crypto';

// Token addresses on Base Sepolia
const TOKENS = {
  ETH: { name: 'Ethereum', symbol: 'ETH', address: null, coingeckoId: 'ethereum' },
  IDRX: { name: 'IDRX', symbol: 'IDRX', address: IDRX as `0x${string}`, coingeckoId: null },
  USDC: { name: 'USD Coin', symbol: 'USDC', address: USDC as `0x${string}`, coingeckoId: 'usd-coin' },
  BTC: { name: 'Bitcoin', symbol: 'BTC', address: null, coingeckoId: 'bitcoin' },
} as const;

interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

interface TokenBalance {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
  price: string;
  change: string;
  hasBalance: boolean;
}

export function useCryptoBalances() {
  const { address } = useAccount();
  const [priceData, setPriceData] = useState<PriceData>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // Fetch ETH balance (native)
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: address,
  });

  // Fetch IDRX balance
  const { data: idrxBalance, isLoading: idrxLoading } = useBalance({
    address: address,
    token: TOKENS.IDRX.address!,
  });

  // Fetch USDC balance
  const { data: usdcBalance, isLoading: usdcLoading } = useBalance({
    address: address,
    token: TOKENS.USDC.address!,
  });

  // Fetch price data from CoinGecko
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoadingPrices(true);
        const ids = ['ethereum', 'bitcoin', 'usd-coin'].join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        setPriceData(data);
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
    // Refresh prices every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format price change
  const formatChange = (change: number | undefined): string => {
    if (change === undefined) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Format price
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined) return '0.00';
    return price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Build crypto assets list with real balances
  const cryptoAssets: TokenBalance[] = useMemo(() => {
    const assets: TokenBalance[] = [];

    // ETH
    if (ethBalance) {
      const ethPrice = priceData['ethereum'];
      assets.push({
        id: 'eth',
        name: TOKENS.ETH.name,
        symbol: TOKENS.ETH.symbol,
        balance: ethBalance.formatted,
        balanceRaw: ethBalance.value,
        decimals: ethBalance.decimals,
        price: formatPrice(ethPrice?.usd),
        change: formatChange(ethPrice?.usd_24h_change),
        hasBalance: ethBalance.value > 0n,
      });
    }

    // IDRX (mock token - no market price)
    if (idrxBalance) {
      assets.push({
        id: 'idrx',
        name: TOKENS.IDRX.name,
        symbol: TOKENS.IDRX.symbol,
        balance: idrxBalance.formatted,
        balanceRaw: idrxBalance.value,
        decimals: idrxBalance.decimals,
        price: '1.00', // Pegged to IDR
        change: '0.00%',
        hasBalance: idrxBalance.value > 0n,
      });
    }

    // USDC
    if (usdcBalance) {
      const usdcPrice = priceData['usd-coin'];
      assets.push({
        id: 'usdc',
        name: TOKENS.USDC.name,
        symbol: TOKENS.USDC.symbol,
        balance: usdcBalance.formatted,
        balanceRaw: usdcBalance.value,
        decimals: usdcBalance.decimals,
        price: formatPrice(usdcPrice?.usd || 1),
        change: formatChange(usdcPrice?.usd_24h_change || 0),
        hasBalance: usdcBalance.value > 0n,
      });
    }

    // BTC (display only - no balance on EVM)
    const btcPrice = priceData['bitcoin'];
    assets.push({
      id: 'btc',
      name: TOKENS.BTC.name,
      symbol: TOKENS.BTC.symbol,
      balance: '0',
      balanceRaw: 0n,
      decimals: 8,
      price: formatPrice(btcPrice?.usd),
      change: formatChange(btcPrice?.usd_24h_change),
      hasBalance: false, // BTC tidak ada di EVM
    });

    return assets;
  }, [ethBalance, idrxBalance, usdcBalance, priceData]);

  // Filter only assets with balance
  const assetsWithBalance = useMemo(() => {
    return cryptoAssets.filter((asset) => asset.hasBalance);
  }, [cryptoAssets]);

  // Calculate total balance in USD
  const totalBalanceUSD = useMemo(() => {
    let total = 0;

    if (ethBalance && priceData['ethereum']) {
      total += parseFloat(ethBalance.formatted) * priceData['ethereum'].usd;
    }

    if (usdcBalance && priceData['usd-coin']) {
      total += parseFloat(usdcBalance.formatted) * (priceData['usd-coin']?.usd || 1);
    }

    // IDRX: assuming 1 IDRX = 1 IDR, convert to USD (rough estimate: 1 USD = 15500 IDR)
    if (idrxBalance) {
      total += parseFloat(idrxBalance.formatted) / 15500;
    }

    return total;
  }, [ethBalance, idrxBalance, usdcBalance, priceData]);

  // Get IDRX balance for main display
  const idrxBalanceFormatted = idrxBalance?.formatted || '0';

  const isLoading = ethLoading || idrxLoading || usdcLoading || isLoadingPrices;

  return {
    cryptoAssets,
    assetsWithBalance,
    allAssets: cryptoAssets,
    totalBalanceUSD,
    idrxBalance: idrxBalanceFormatted,
    ethBalance: ethBalance?.formatted || '0',
    usdcBalance: usdcBalance?.formatted || '0',
    isLoading,
    priceData,
  };
}

export function toCryptoAsset(token: TokenBalance): CryptoAsset {
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    price: token.balance,
    change: token.change,
  };
}
