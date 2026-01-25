"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signupWithEmail, loginWithWallet } from "@/app/actions/auth";
import { Wallet, Mail, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"email" | "wallet">("email");

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signupWithEmail(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleWalletConnect = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!window.solana) {
        setError("Phantom wallet not found. Please install it first.");
        window.open("https://phantom.app/", "_blank");
        setIsLoading(false);
        return;
      }

      const resp = await window.solana.connect();
      const walletAddress = resp.publicKey.toString();

      // Create message to sign
      const message = `Sign this message to authenticate with your wallet: ${walletAddress}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await window.solana.signMessage(
        encodedMessage,
        "utf8"
      );
      const signature = Buffer.from(signedMessage.signature).toString("hex");

      const result = await loginWithWallet(walletAddress, signature, message);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("[v0] Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up with email or connect your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "email" ? "default" : "outline"}
              onClick={() => {
                setMode("email");
                setError("");
              }}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button
              variant={mode === "wallet" ? "default" : "outline"}
              onClick={() => {
                setMode("wallet");
                setError("");
              }}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Wallet
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {mode === "email" ? (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-2">Connect with Phantom</p>
                <p>
                  You'll be asked to sign a message to verify you own this
                  wallet. No transaction fees required.
                </p>
              </div>
              <Button
                onClick={handleWalletConnect}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Phantom Wallet
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
