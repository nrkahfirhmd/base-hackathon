import Image from 'next/image';
import { InvoiceCardProps } from '@/app/types/invoice';

const InvoiceCard: React.FC<InvoiceCardProps> = ({
    invoiceNumber = "#INV-2026001",
    date = "Friday, January 2, 2026",
    transferMethod = "BTC",
    from = "Dzikri#2301",
    to = "Danis#2115",
    gasFee = "IDRX 10.25",
    transferAmount = "IDRX 201.15",
    total = "IDRX 210.35"
}) => {
    return (
        <div className="bg-[#2a2d44] rounded-3xl p-8">
            {/* Success Badge */}
            <div className="flex flex-col items-center mb-8">
                <Image src="/success-logo.svg" alt="Success" width={64} height={64} className="mb-4" />
                <h2 className="text-2xl font-semibold">Transaction Succeed</h2>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-4">
                {/* Invoice Number */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Invoice</span>
                    <span className="font-semibold">{invoiceNumber}</span>
                </div>

                {/* Date */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Date</span>
                    <span className="font-semibold">{date}</span>
                </div>

                {/* Transfer Method */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transfer Method</span>
                    <span className="font-semibold">{transferMethod}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-4"></div>

                {/* From */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">From</span>
                    <span className="font-semibold">{from}</span>
                </div>

                {/* To */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">To</span>
                    <span className="font-semibold">{to}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-4"></div>

                {/* Gas Fee */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Gas Fee</span>
                    <span className="font-semibold italic">{gasFee}</span>
                </div>

                {/* Transfer Amount */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transfer Amounts</span>
                    <span className="font-semibold italic">{transferAmount}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-4"></div>

                {/* Total */}
                <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total</span>
                    <span className="font-bold text-lg italic">{total}</span>
                </div>
            </div>
        </div>
    );
};

export default InvoiceCard;
