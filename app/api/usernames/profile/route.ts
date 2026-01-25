// Create this file: app/api/usernames/profile/route.ts

import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
} from "@bonfida/spl-name-service";

// Constants for SNS (.sol domains)
const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);
const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.toLowerCase().trim();

  if (!username || username.length < 1) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    // Derive the name account key for username.sol
    const hashedName = await getHashedName(username);
    const nameAccountKey = await getNameAccountKey(
      hashedName,
      undefined,
      SOL_TLD_AUTHORITY
    );

    // Fetch the account info
    const accountInfo = await connection.getAccountInfo(nameAccountKey);

    if (!accountInfo || accountInfo.data.length === 0) {
      // No account → available
      return NextResponse.json({
        username,
        available: true,
      });
    }

    // Parse the registry state to get owner
    const registry = NameRegistryState.deserialize(accountInfo.data);

    return NextResponse.json({
      username,
      available: false,
      owner: registry.owner.toBase58(),
      wallet: registry.owner.toBase58(), // same as owner
      solAddress: registry.owner.toBase58(),
      length: username.length,
      // You can add more parsing for rarity/background if needed
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch username data" },
      { status: 500 }
    );
  }
}
