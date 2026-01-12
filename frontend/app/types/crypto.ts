export interface CryptoAsset {
  id: number | string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  color: string; // Tailwind class string, misal: "bg-blue-500"
}