import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import User from "@/app/server/models/User.js";
import Blog from "@/app/server/models/Blog.js";
import Contact from "@/app/server/models/Contact.js";
import Quote from "@/app/server/models/Quote.js";
import Project from "@/app/server/models/Project.js";
import { connectDB } from "@/app/server/db/connect.js";
import { NextResponse } from "next/server";

// GET /api/dashboard/stats
// Fetch aggregated statistics from all collections
export async function GET(req) {
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      try {
        await connectDB();

        // Fetch counts from all collections in parallel
        const [usersCount, blogsCount, contactsCount, quotesCount, projectsCount] = await Promise.all([
          User.countDocuments({ isActive: true }),
          Blog.countDocuments({ status: "published" }),
          Contact.countDocuments(),
          Quote.countDocuments(),
          Project.countDocuments(),
        ]);

        // Count pending/open items
        const [pendingContacts, pendingQuotes] = await Promise.all([
          Contact.countDocuments({ status: "pending" }),
          Quote.countDocuments({ status: "pending" }),
        ]);

        const stats = {
          users: usersCount,
          blogs: blogsCount,
          contacts: contactsCount,
          quotes: quotesCount,
          projects: projectsCount,
          requests: pendingQuotes + pendingContacts, // Combined pending items
          pendingContacts,
          pendingQuotes,
        };

        return NextResponse.json(
          {
            success: true,
            stats,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message,
          },
          { status: 500 }
        );
      }
    });
  });
}
