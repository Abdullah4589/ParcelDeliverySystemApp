const express = require("express");
const router = express.Router();
const { Parcel, User, ActivityLog, Settings } = require("../db");
const { logActivity } = require("../middleware/auth");

// ANALYTICS OVERVIEW
router.get("/analytics", async (req, res) => {
  try {
    const [parcels, users] = await Promise.all([
      Parcel.find().sort({ createdAt: -1 }),
      User.find().select("-password").sort({ createdAt: -1 }),
    ]);

    const totalParcels = parcels.length;
    const totalUsers = users.length;

    const stageCounts = {
      pending: 0,
      picked_up: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      delayed: 0,
      cancelled: 0,
    };

    const tierStats = {
      economy: { count: 0, revenue: 0 },
      standard: { count: 0, revenue: 0 },
      express: { count: 0, revenue: 0 },
      overnight: { count: 0, revenue: 0 },
    };

    let totalRevenue = 0;
    let paidRevenue = 0;
    let totalWeight = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    const routeCounts = {};
    const monthlyMap = {};

    for (const p of parcels) {
      const stage = p.stage || (p.status >= 2 ? "delivered" : "pending");
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;

      const cost = Number(p.cost) || 0;
      totalRevenue += cost;
      if (p.paymentStatus !== "refunded" && p.paymentStatus !== "unpaid") {
        paidRevenue += cost;
      }
      totalWeight += Number(p.weight) || 0;

      if (p.rating) {
        ratingSum += p.rating;
        ratingCount += 1;
      }

      const tier = p.serviceTier || "standard";
      if (!tierStats[tier]) tierStats[tier] = { count: 0, revenue: 0 };
      tierStats[tier].count += 1;
      tierStats[tier].revenue = Number(
        (tierStats[tier].revenue + cost).toFixed(2)
      );

      const routeKey = `${p.from} → ${p.to}`;
      routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;

      const dt = p.createdAt ? new Date(p.createdAt) : new Date();
      const monthKey = dt.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          shipments: 0,
          delivered: 0,
          revenue: 0,
        };
      }
      monthlyMap[monthKey].shipments += 1;
      if (stage === "delivered") monthlyMap[monthKey].delivered += 1;
      monthlyMap[monthKey].revenue = Number(
        (monthlyMap[monthKey].revenue + cost).toFixed(2)
      );
    }

    const activeCount =
      stageCounts.pending +
      stageCounts.picked_up +
      stageCounts.in_transit +
      stageCounts.out_for_delivery +
      stageCounts.delayed;

    const deliveryRate =
      totalParcels > 0
        ? Number(((stageCounts.delivered / totalParcels) * 100).toFixed(1))
        : 0;

    const avgRating =
      ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

    const topRoutes = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const roleBreakdown = users.reduce(
      (acc, u) => {
        const r = u.role || "user";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      },
      { user: 0, driver: 0, admin: 0 }
    );

    res.status(200).json({
      kpis: {
        totalParcels,
        totalUsers,
        activeParcels: activeCount,
        deliveredParcels: stageCounts.delivered,
        pendingParcels: stageCounts.pending,
        delayedParcels: stageCounts.delayed,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        paidRevenue: Number(paidRevenue.toFixed(2)),
        totalWeight: Number(totalWeight.toFixed(1)),
        deliveryRate,
        avgRating,
        ratingCount,
      },
      stageCounts,
      tierStats,
      monthlyTrend: Object.values(monthlyMap).reverse().slice(-6),
      topRoutes,
      roleBreakdown,
      recentUsers: users.slice(0, 6),
      recentParcels: parcels.slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ACTIVITY LOGS
router.get("/logs", async (req, res) => {
  try {
    const { category, severity, limit = 100 } = req.query;
    const query = {};
    if (category && category !== "all") query.category = category;
    if (severity && severity !== "all") query.severity = severity;

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(500, Number(limit) || 100));

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SETTINGS
router.get("/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: "global" });
    if (!settings) {
      settings = await Settings.create({ key: "global" });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE SETTINGS
router.put("/settings", async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: "global" },
      { $set: req.body },
      { new: true, upsert: true }
    );

    await logActivity({
      action: "SETTINGS_UPDATED",
      category: "settings",
      actor: req.body.updatedBy || "Admin",
      details: "Updated platform & pricing settings.",
      severity: "info",
    });

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FULL BACKUP EXPORT
router.get("/backup/export", async (req, res) => {
  try {
    const [parcels, users, settings, logs] = await Promise.all([
      Parcel.find().sort({ createdAt: -1 }),
      User.find().select("-password").sort({ createdAt: -1 }),
      Settings.findOne({ key: "global" }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(500),
    ]);

    await logActivity({
      action: "BACKUP_EXPORTED",
      category: "system",
      actor: "Admin",
      details: `Exported system backup (${parcels.length} parcels, ${users.length} users).`,
      severity: "success",
    });

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      version: "2.0.0",
      counts: {
        parcels: parcels.length,
        users: users.length,
        logs: logs.length,
      },
      data: {
        settings,
        users,
        parcels,
        logs,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
