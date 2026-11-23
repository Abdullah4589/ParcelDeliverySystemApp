const mongoose = require("mongoose");
const dotenv = require("dotenv");
const CryptoJs = require("crypto-js");
const { User, Parcel, Settings, ActivityLog } = require("./db");
const { getPassSecret } = require("./middleware/auth");

dotenv.config();

const DB_URI = process.env.DB || "mongodb://127.0.0.1:27017/sendit";

const encrypt = (plain) =>
  CryptoJs.AES.encrypt(plain, getPassSecret()).toString();

async function seedData() {
  await Settings.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { upsert: true, new: true }
  );

  const demoUsers = [
    {
      fullname: "Elena Vance",
      email: "admin@sendit.io",
      phone: "+1 (415) 555-0101",
      age: 34,
      country: "United States",
      address: "500 Market St, San Francisco, CA",
      role: "admin",
      status: 1,
      password: encrypt("Admin@123"),
    },
    {
      fullname: "Alex Rivera",
      email: "alex@sendit.io",
      phone: "+1 (212) 555-0148",
      age: 29,
      country: "United States",
      address: "220 Mercer St, New York, NY",
      role: "user",
      status: 1,
      password: encrypt("User@123"),
      savedAddresses: [
        {
          label: "Chicago Office",
          recipientName: "Maya Chen",
          email: "maya.chen@example.com",
          phone: "+1 (312) 555-0192",
          address: "233 S Wacker Dr, Suite 400",
          city: "Chicago, IL",
          country: "USA",
        },
        {
          label: "Austin Warehouse",
          recipientName: "Liam O'Connor",
          email: "liam@example.com",
          phone: "+1 (512) 555-0174",
          address: "600 Congress Ave",
          city: "Austin, TX",
          country: "USA",
        },
      ],
    },
    {
      fullname: "Marcus Cole",
      email: "driver@sendit.io",
      phone: "+1 (312) 555-0188",
      age: 31,
      country: "United States",
      address: "110 N Carpenter St, Chicago, IL",
      role: "driver",
      status: 1,
      password: encrypt("Driver@123"),
    },
    {
      fullname: "Sofia Patel",
      email: "sofia@sendit.io",
      phone: "+44 20 7946 0958",
      age: 27,
      country: "United Kingdom",
      address: "22 Bishopsgate, London",
      role: "user",
      status: 1,
      password: encrypt("User@123"),
    },
  ];

  for (const u of demoUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      { $setOnInsert: u },
      { upsert: true }
    );
  }

  const existingParcels = await Parcel.countDocuments();
  if (existingParcels === 0) {
    const today = new Date();
    const fmt = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split("T")[0];
    };

    const sampleParcels = [
      {
        trackingNumber: "SND-2026-AX94K2",
        from: "New York, NY",
        to: "Chicago, IL",
        sendername: "Alex Rivera",
        recipientname: "Maya Chen",
        senderemail: "alex@sendit.io",
        recipientemail: "maya.chen@example.com",
        senderphone: "+1 212-555-0148",
        recipientphone: "+1 312-555-0192",
        weight: 4.2,
        dimensions: { length: 35, width: 25, height: 18 },
        parcelType: "electronics",
        serviceTier: "express",
        insurance: { enabled: true, declaredValue: 1200, fee: 24 },
        cost: 64.5,
        paymentStatus: "paid",
        paymentMethod: "card",
        date: fmt(-2),
        estimatedDelivery: fmt(1),
        currentLocation: "Cleveland Sorting Hub, OH",
        assignedDriver: "Marcus Cole",
        note: "MacBook Pro & dock — signature required",
        stage: "in_transit",
        status: 1,
        trackingHistory: [
          {
            stage: "pending",
            location: "New York, NY",
            description: "Shipment booked online and shipping label created.",
            updatedBy: "SendIT Portal",
            timestamp: new Date(Date.now() - 48 * 3600 * 1000),
          },
          {
            stage: "picked_up",
            location: "Manhattan Depot, NY",
            description: "Parcel collected by courier from sender address.",
            updatedBy: "Marcus Cole",
            timestamp: new Date(Date.now() - 36 * 3600 * 1000),
          },
          {
            stage: "in_transit",
            location: "Cleveland Sorting Hub, OH",
            description:
              "Arrived at regional transit facility and sorted for Midwest linehaul.",
            updatedBy: "Automated Scanner",
            timestamp: new Date(Date.now() - 8 * 3600 * 1000),
          },
        ],
      },
      {
        trackingNumber: "SND-2026-LM72Q8",
        from: "New York, NY",
        to: "Austin, TX",
        sendername: "Alex Rivera",
        recipientname: "Liam O'Connor",
        senderemail: "alex@sendit.io",
        recipientemail: "liam@example.com",
        weight: 1.8,
        parcelType: "document",
        serviceTier: "overnight",
        cost: 42.0,
        paymentStatus: "paid",
        paymentMethod: "wallet",
        date: fmt(-5),
        estimatedDelivery: fmt(-4),
        deliveredAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        currentLocation: "Austin, TX",
        assignedDriver: "Marcus Cole",
        note: "Signed legal contracts",
        feedback: "Super fast overnight delivery, arrived before 10 AM!",
        rating: 5,
        stage: "delivered",
        status: 3,
        trackingHistory: [
          {
            stage: "pending",
            location: "New York, NY",
            description: "Overnight priority order confirmed.",
            updatedBy: "SendIT Portal",
            timestamp: new Date(Date.now() - 120 * 3600 * 1000),
          },
          {
            stage: "in_transit",
            location: "JFK Air Cargo, NY",
            description: "Departed on overnight air freight.",
            updatedBy: "Air Cargo Ops",
            timestamp: new Date(Date.now() - 108 * 3600 * 1000),
          },
          {
            stage: "delivered",
            location: "Austin, TX",
            description: "Delivered to front desk and signed by Liam O'Connor.",
            updatedBy: "Marcus Cole",
            timestamp: new Date(Date.now() - 96 * 3600 * 1000),
          },
        ],
      },
      {
        trackingNumber: "SND-2026-PR39V5",
        from: "San Francisco, CA",
        to: "New York, NY",
        sendername: "Elena Vance",
        recipientname: "Alex Rivera",
        senderemail: "admin@sendit.io",
        recipientemail: "alex@sendit.io",
        weight: 6.5,
        parcelType: "fragile",
        serviceTier: "standard",
        insurance: { enabled: true, declaredValue: 450, fee: 9 },
        cost: 48.25,
        paymentStatus: "paid",
        paymentMethod: "card",
        date: fmt(-1),
        estimatedDelivery: fmt(0),
        currentLocation: "Brooklyn Delivery Station, NY",
        assignedDriver: "Marcus Cole",
        note: "Ceramic prototype samples — handle with care",
        stage: "out_for_delivery",
        status: 1,
        trackingHistory: [
          {
            stage: "pending",
            location: "San Francisco, CA",
            description: "Order created with fragile handling tag.",
            updatedBy: "Elena Vance",
            timestamp: new Date(Date.now() - 72 * 3600 * 1000),
          },
          {
            stage: "in_transit",
            location: "Denver Distribution Center, CO",
            description: "Cross-country transit checkpoint cleared.",
            updatedBy: "Hub Scanner",
            timestamp: new Date(Date.now() - 32 * 3600 * 1000),
          },
          {
            stage: "out_for_delivery",
            location: "Brooklyn Delivery Station, NY",
            description: "Loaded onto local delivery van #14.",
            updatedBy: "Marcus Cole",
            timestamp: new Date(Date.now() - 3 * 3600 * 1000),
          },
        ],
      },
      {
        trackingNumber: "SND-2026-KD81M4",
        from: "London, UK",
        to: "Toronto, CA",
        sendername: "Sofia Patel",
        recipientname: "Noah Tremblay",
        senderemail: "sofia@sendit.io",
        recipientemail: "noah@example.com",
        weight: 3.1,
        parcelType: "standard",
        serviceTier: "express",
        cost: 56.8,
        paymentStatus: "paid",
        paymentMethod: "invoice",
        date: fmt(0),
        estimatedDelivery: fmt(2),
        currentLocation: "London, UK",
        assignedDriver: "Unassigned",
        note: "Apparel sample kit",
        stage: "pending",
        status: 1,
      },
      {
        trackingNumber: "SND-2026-ZT45W9",
        from: "Miami, FL",
        to: "Seattle, WA",
        sendername: "Alex Rivera",
        recipientname: "Chloe Park",
        senderemail: "alex@sendit.io",
        recipientemail: "chloe.park@example.com",
        weight: 9.4,
        parcelType: "perishable",
        serviceTier: "express",
        cost: 89.4,
        paymentStatus: "unpaid",
        paymentMethod: "cod",
        date: fmt(-3),
        estimatedDelivery: fmt(1),
        currentLocation: "Memphis Air Hub, TN",
        assignedDriver: "Marcus Cole",
        note: "Temperature-controlled coffee roast batch",
        stage: "delayed",
        status: 1,
        trackingHistory: [
          {
            stage: "pending",
            location: "Miami, FL",
            description: "Perishable shipment scheduled.",
            updatedBy: "SendIT Portal",
            timestamp: new Date(Date.now() - 70 * 3600 * 1000),
          },
          {
            stage: "delayed",
            location: "Memphis Air Hub, TN",
            description:
              "Brief weather delay at regional airport; rerouted to next flight.",
            updatedBy: "Hub Ops",
            timestamp: new Date(Date.now() - 10 * 3600 * 1000),
          },
        ],
      },
      {
        trackingNumber: "SND-2026-BN66J1",
        from: "Boston, MA",
        to: "Washington, DC",
        sendername: "Sofia Patel",
        recipientname: "Jordan Lee",
        senderemail: "sofia@sendit.io",
        recipientemail: "jordan@example.com",
        weight: 2.5,
        parcelType: "standard",
        serviceTier: "economy",
        cost: 18.5,
        paymentStatus: "paid",
        paymentMethod: "card",
        date: fmt(-8),
        estimatedDelivery: fmt(-2),
        deliveredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        currentLocation: "Washington, DC",
        assignedDriver: "Marcus Cole",
        note: "Hardcover books",
        feedback: "Package arrived clean and intact.",
        rating: 4,
        stage: "delivered",
        status: 3,
      },
    ];

    await Parcel.insertMany(sampleParcels);
    await ActivityLog.create({
      action: "DATABASE_SEEDED",
      category: "system",
      actor: "System",
      details: `Seeded ${demoUsers.length} demo users and ${sampleParcels.length} sample parcels.`,
      severity: "success",
    });
    console.log(`Seeded ${sampleParcels.length} sample parcels.`);
  }
}

if (require.main === module) {
  mongoose
    .connect(DB_URI)
    .then(async () => {
      console.log("Connected to MongoDB for seeding...");
      await seedData();
      console.log("Seed completed successfully!");
      console.log("Demo Admin: admin@sendit.io / Admin@123");
      console.log("Demo User : alex@sendit.io  / User@123");
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}

module.exports = { seedData };
