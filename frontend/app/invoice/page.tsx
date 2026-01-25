'use client';

import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import SecondaryButton from '@/components/ui/buttons/SecondaryButton';
import InvoiceCard from '@/components/ui/cards/InvoiceCard';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Invoice() {
    const router = useRouter();
    const [showSuccess, setShowSuccess] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSuccess(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#1B1E34] text-white overflow-hidden">
            <AnimatePresence mode="wait">
                {showSuccess ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="min-h-screen flex items-center justify-center overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                        >
                            <Image
                                src="/success-logo.svg"
                                alt="Success"
                                width={200}
                                height={200}
                            />
                        </motion.div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col min-h-screen pt-8 px-6">
                        <div className="pb-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="max-w-2xl mx-auto grow w-full">
                            {/* Invoice Card */}
                            <InvoiceCard
                                invoiceNumber="#INV-2026001"
                                date="Friday, January 2, 2026"
                                transferMethod="BTC"
                                from="Dzikri#2301"
                                to="Danis#2115"
                                gasFee="IDRX 10.25"
                                transferAmount="IDRX 201.15"
                                total="IDRX 210.35"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 max-w-2xl mx-auto w-full pb-4">
                            <SecondaryButton onClick={() => {/* Implement download functionality */}}>
                                Download Invoice
                            </SecondaryButton>
                            <SecondaryButton onClick={() => {/* Implement share functionality */}}>
                                Share Invoice
                            </SecondaryButton>
                            <PrimaryButton onClick={() => {/* Implement done payment functionality */}}>
                                Done Payment
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}