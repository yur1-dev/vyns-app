import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { User, Username } from "@/models";
import { nanoid } from "nanoid";
import { getTierFromLength } from "@/types/dashboard";

// GET /api/user/[wallet] — fetch or auto-create user, joins usernames
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    await connectDB();
    const { wallet } = await params;

    let user = await User.findOne({ wallet });

    if (!user) {
      user = await User.create({
        wallet,
        xp: 0,
        level: 1,
        earnings: 0,
        stakedAmount: 0,
        referralCode: nanoid(8),
      });
    }

    // Join usernames from the Username collection
    const usernameRecords = await Username.find({ walletAddress: wallet });

    const usernames = usernameRecords.map((u) => {
      const tier =
        (u.stats as any)?.tier ?? getTierFromLength(u.username.length);
      return {
        id: u._id.toString(),
        name: u.username,
        username: u.username,
        tier,
        yield: (u.stats as any)?.yieldRate ?? u.totalYield ?? 0,
        value: (u.stats as any)?.price ?? 0,
        expiresAt:
          (u.stats as any)?.expiresAt ??
          new Date(Date.now() + 365 * 86_400_000).toISOString(),
        claimedAt:
          (u.stats as any)?.claimedAt ??
          (u as any).createdAt?.toISOString() ??
          new Date().toISOString(),
        staked: (u.stats as any)?.staked ?? false,
      };
    });

    const payload = {
      ...user.toObject(),
      usernames,
      earnings: {
        today: 0,
        week: 0,
        month: 0,
        allTime: user.earnings ?? 0,
      },
      stakedAmount: user.stakedAmount ?? 0,
      stakingPositions: [],
      referrals: 0,
      referralCode: user.referralCode,
      activity: [],
      isNewUser: usernameRecords.length === 0,
    };

    return NextResponse.json({ success: true, user: payload });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// POST /api/user/[wallet] — update user data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    await connectDB();
    const { wallet } = await params;
    const body = await req.json();

    const allowedFields = [
      "username",
      "avatar",
      "xp",
      "level",
      "earnings",
      "stakedAmount",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const user = await User.findOneAndUpdate(
      { wallet },
      { $set: updates },
      { new: true, upsert: true },
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("POST /api/user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 },
    );
  }
}
