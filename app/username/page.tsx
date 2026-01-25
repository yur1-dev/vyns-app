"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Wallet as WalletIcon,
  Shield,
  Globe,
  Calendar,
  Star,
  Copy,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface ProfileData {
  username: string;
  available: boolean;
  owner?: string;
  wallet?: string;
  registeredAt?: string;
  length?: number;
  rarity?: string[];
  background?: string; // URL or "default"
  solAddress?: string;
  ethAddress?: string;
}

export default function UsernameProfile() {
  const { username } = useParams();
  const decodedUsername = decodeURIComponent(username as string).toLowerCase();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (decodedUsername) {
      fetchProfile(decodedUsername);
    }
  }, [decodedUsername]);

  const fetchProfile = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usernames/profile?username=${name}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyWallet = () => {
    if (profile?.wallet) {
      navigator.clipboard.writeText(profile.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent"
          >
            VYNS
          </Link>
          <WalletMultiButton className="!bg-gradient-to-r !from-teal-600 !to-indigo-700 !rounded-full !px-8 !py-3" />
        </div>
      </nav>

      {/* Background Header */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/20 via-purple-900/10 to-black" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-teal-400 mb-8 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Search
          </Link>

          <div className="flex items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 p-1">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-4xl font-bold">
                {decodedUsername[0].toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div>
              <h1 className="text-6xl font-bold mb-2">@{decodedUsername}</h1>
              {profile?.available ? (
                <p className="text-2xl text-teal-400 font-medium">
                  Available for Registration
                </p>
              ) : (
                <p className="text-xl text-gray-400">
                  Owned by{" "}
                  <span className="font-mono text-teal-300">
                    {profile?.wallet
                      ? `${profile.wallet.slice(0, 6)}...${profile.wallet.slice(
                          -4
                        )}`
                      : "Unknown"}
                  </span>
                </p>
              )}
              {/* Rarity Tags */}
              {!profile?.available && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="bg-purple-600/40 text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
                    Domain
                  </span>
                  <span className="bg-red-600/40 text-red-300 px-4 py-2 rounded-full text-sm font-medium">
                    Rare
                  </span>
                  {profile?.length && (
                    <span className="bg-orange-600/40 text-orange-300 px-4 py-2 rounded-full text-sm font-medium">
                      {profile.length} Letters
                    </span>
                  )}
                  <span className="bg-yellow-600/40 text-yellow-300 px-4 py-2 rounded-full text-sm font-medium">
                    Dictionary Word
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-8">
            {/* Addresses */}
            <div className="bg-gray-900/60 rounded-3xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <WalletIcon className="w-7 h-7 text-teal-400" />
                Addresses
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-1">Solana (Deposit Address)</p>
                  <p className="font-mono text-teal-300 break-all">
                    {profile?.solAddress ||
                      (profile?.available
                        ? "Will be assigned after registration"
                        : "Not set")}
                  </p>
                </div>
              </div>
            </div>

            {/* Ownership */}
            {!profile?.available && (
              <div className="bg-gray-900/60 rounded-3xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Ownership</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600" />
                  <div>
                    <p className="text-gray-400">Owner</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-teal-300">
                        {profile?.wallet?.slice(0, 8)}...
                        {profile?.wallet?.slice(-6)}
                      </p>
                      <button
                        onClick={copyWallet}
                        className="text-gray-400 hover:text-teal-400"
                      >
                        {copied ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {profile?.registeredAt && (
                  <div className="mt-6 flex items-center gap-3 text-gray-400">
                    <Calendar className="w-5 h-5" />
                    Registered{" "}
                    {new Date(profile.registeredAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Other Records */}
            <div className="bg-gray-900/60 rounded-3xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold mb-4">Other Records</h3>
              <p className="text-gray-400">DNS and Decentralized Storage</p>
              <Link
                href="#"
                className="text-teal-400 hover:text-teal-300 mt-4 inline-block"
              >
                View →
              </Link>
            </div>
          </div>

          {/* Right Column - Action / Background */}
          <div className="lg:col-span-2">
            {/* Background Settings */}
            <div className="bg-gray-900/60 rounded-3xl p-10 border border-gray-800 mb-10">
              <h3 className="text-3xl font-bold mb-8">
                Domain's Background Setting
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Current Background */}
                <div className="text-center">
                  <div className="relative w-full aspect-square max-w-md mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <p className="text-4xl font-bold text-white">
                        @{decodedUsername}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-semibold">Default</p>
                </div>

                {/* Limited Backgrounds */}
                <div>
                  <div className="bg-black/40 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="w-8 h-8 text-yellow-400" />
                      <p className="text-xl font-bold">Limited Background</p>
                    </div>
                    <p className="text-gray-400 mb-6">
                      Limited edition backgrounds are jointly issued by VYNS and
                      other partners. The issuance activities are launched from
                      time to time.
                    </p>
                    <p className="text-center text-gray-500 text-lg">
                      No other background
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Only if Available */}
            {profile?.available && (
              <div className="bg-gradient-to-br from-teal-900/40 to-indigo-900/40 rounded-3xl p-12 text-center border-2 border-teal-500/50">
                <h2 className="text-5xl font-bold mb-8 text-teal-300">
                  This name is Available!
                </h2>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white px-12 py-5 rounded-full text-xl font-semibold flex items-center gap-4 transition-all hover:shadow-xl">
                    <ShoppingCart className="w-7 h-7" />
                    Add to Basket
                  </button>

                  <Link
                    href={`/app/claim?username=${decodedUsername}`}
                    className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white px-14 py-5 rounded-full text-xl font-bold flex items-center gap-4 transition-all hover:shadow-2xl hover:shadow-teal-500/60"
                  >
                    <Zap className="w-7 h-7" />
                    Register Now
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-8 max-w-md mx-auto">
                  <div>
                    <p className="text-gray-400">Registration Fee</p>
                    <p className="text-3xl font-bold text-teal-400">0.1 SOL</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Annual Renewal</p>
                    <p className="text-2xl font-bold text-gray-300">0.05 SOL</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
