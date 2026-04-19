import express from "express";
import Subscriber from "../models/Subscriber.js";
import Contact from "../models/Contact.js";
import VendorRequest from "../models/VendorRequest.js";
import Service from "../models/Service.js";
import {
  sendVendorRegistrationSubmittedEmail,
  sendSubscriptionEmail,
  sendContactEmail,
  sendAdminContactNotificationEmail,
} from "../services/emailService.js";
import {
  sendVendorRegistrationReceivedSMS,
} from "../services/twilioService.js";

const router = express.Router();

// POST /api/subscribe
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  try {
    // upsert subscriber
    const existing = await Subscriber.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.json({ message: "You're already subscribed" });
    }
    const sub = new Subscriber({ email });
    await sub.save();

    // ✅ Send subscription confirmation email
    try {
      await sendSubscriptionEmail(email).catch((err) => {
        console.error("❌ Subscription email failed:", err.message);
      });
    } catch (emailErr) {
      console.error("Email sending error:", emailErr.message);
      // Don't fail the subscription if email fails
    }

    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to subscribe", error: err.message });
  }
});

// POST /api/contact
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ message: "Name, email and message are required" });
  }
  try {
    const contact = new Contact({ name, email, message });
    await contact.save();

    // ✅ Send contact confirmation email to user
    try {
      await sendContactEmail(email, name).catch((err) => {
        console.error("❌ Contact confirmation email failed:", err.message);
      });
    } catch (emailErr) {
      console.error("Email sending error:", emailErr.message);
      // Don't fail if email fails to send
    }

    // ✅ Send admin notification email
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@verdora.com";
      await sendAdminContactNotificationEmail(adminEmail, {
        name,
        email,
        message,
      }).catch((err) => {
        console.error("❌ Admin notification email failed:", err.message);
      });
    } catch (adminEmailErr) {
      console.error("Admin email sending error:", adminEmailErr.message);
      // Don't fail the request if admin email fails
    }

    res.json({ message: "Message received. We'll get back to you soon." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to save message", error: err.message });
  }
});

// POST /api/vendor-register - Submit vendor registration request
router.post("/vendor-register", async (req, res) => {
  const { vendorName, shopName, email, phone, address } = req.body;

  if (!vendorName || !shopName || !email || !phone || !address) {
    return res
      .status(400)
      .json({ message: "All fields are required" });
  }

  try {
    // Check if vendor request already exists
    const existing = await VendorRequest.findOne({
      email: email.toLowerCase().trim(),
      status: "pending",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already submitted a vendor registration request" });
    }

    const vendorRequest = new VendorRequest({
      vendorName: vendorName.trim(),
      shopName: shopName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    await vendorRequest.save();

    // ✅ SEND VENDOR REGISTRATION RECEIVED NOTIFICATION
    try {
      if (email) {
        await sendVendorRegistrationSubmittedEmail(
          email,
          vendorName,
          shopName
        ).catch((err) => console.error("❌ Vendor registration email failed:", err.message));
      }

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      if (phone) {
        await sendVendorRegistrationReceivedSMS(
          formattedPhone,
          vendorName
        ).catch((err) => console.error("❌ Vendor registration SMS failed:", err.message));
      }
    } catch (notificationErr) {
      console.error("Vendor registration notification failed:", notificationErr.message);
    }

    res.json({
      message:
        "Thank you for your interest! We will contact you shortly to complete your vendor registration.",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to submit registration", error: err.message });
  }
});

// GET /api/services - Fetch all active services from database
router.get("/services", async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: 1 });
    
    // If no services in database, return mock data
    if (!services || services.length === 0) {
      const mockServices = [
        {
          slug: "plant-care",
          title: "Plant Care & Maintenance",
          desc: "Keep your plants healthy and thriving with our expert care.",
          details: "Our plant care service includes watering, pruning, fertilization, and pest control to ensure your plants stay vibrant all year round.",
          image: "/images/plant-care.jpg",
          packages: [
            { name: "Basic Care", desc: "Weekly watering and pruning for small gardens.", price: 499 },
            { name: "Premium Care", desc: "Comprehensive care including fertilization and pest control.", price: 999 }
          ],
          isActive: true
        },
        {
          slug: "home-decor",
          title: "Home Decor & Styling",
          desc: "Elevate your living spaces with elegant, plant-inspired decor.",
          details: "We design and style homes with lush greenery, natural accents, and premium plant-based decor that brings warmth and sophistication to your interiors.",
          image: "/images/home-decor.jpg",
          packages: [
            { name: "Living Room Styling", desc: "Transform your living room with curated plants, accent pieces, and cozy layouts.", price: 2499 },
            { name: "Bedroom Decor", desc: "Create a calming, nature-inspired bedroom with elegant plant styling.", price: 1499 },
            { name: "Balcony & Outdoor Styling", desc: "Design refreshing balcony and patio spaces with greenery and decor accents.", price: 999 }
          ],
          isActive: true
        },
        {
          slug: "landscaping",
          title: "Landscaping & Garden Design",
          desc: "Create stunning outdoor spaces with our expert landscaping.",
          details: "From concept to completion, we design and build gardens that inspire.",
          image: "/images/landscaping.jpg",
          packages: [
            { name: "Basic Landscaping", desc: "Simple layouts for small spaces.", price: 4999 },
            { name: "Premium Landscaping", desc: "Full-scale design with premium plants and features.", price: 9999 }
          ],
          isActive: true
        }
      ];
      console.warn("⚠️  No services in database, using mock data");
      return res.json(mockServices);
    }
    
    res.json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    // Return mock data on error as well
    const mockServices = [
      {
        slug: "plant-care",
        title: "Plant Care & Maintenance",
        desc: "Keep your plants healthy and thriving with our expert care.",
        details: "Our plant care service includes watering, pruning, fertilization, and pest control to ensure your plants stay vibrant all year round.",
        image: "/images/plant-care.jpg",
        packages: [
          { name: "Basic Care", desc: "Weekly watering and pruning for small gardens.", price: 499 },
          { name: "Premium Care", desc: "Comprehensive care including fertilization and pest control.", price: 999 }
        ],
        isActive: true
      },
      {
        slug: "home-decor",
        title: "Home Decor & Styling",
        desc: "Elevate your living spaces with elegant, plant-inspired decor.",
        details: "We design and style homes with lush greenery, natural accents, and premium plant-based decor that brings warmth and sophistication to your interiors.",
        image: "/images/home-decor.jpg",
        packages: [
          { name: "Living Room Styling", desc: "Transform your living room with curated plants, accent pieces, and cozy layouts.", price: 2499 },
          { name: "Bedroom Decor", desc: "Create a calming, nature-inspired bedroom with elegant plant styling.", price: 1499 },
          { name: "Balcony & Outdoor Styling", desc: "Design refreshing balcony and patio spaces with greenery and decor accents.", price: 999 }
        ],
        isActive: true
      },
      {
        slug: "landscaping",
        title: "Landscaping & Garden Design",
        desc: "Create stunning outdoor spaces with our expert landscaping.",
        details: "From concept to completion, we design and build gardens that inspire.",
        image: "/images/landscaping.jpg",
        packages: [
          { name: "Basic Landscaping", desc: "Simple layouts for small spaces.", price: 4999 },
          { name: "Premium Landscaping", desc: "Full-scale design with premium plants and features.", price: 9999 }
        ],
        isActive: true
      }
    ];
    console.warn("⚠️  Error fetching services, using mock data:", err.message);
    res.json(mockServices);
  }
});

// GET /api/services/:slug - Fetch single service by slug
router.get("/services/:slug", async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug.toLowerCase(), isActive: true });
    
    if (!service) {
      // Return mock service data as fallback
      const mockServices = {
        "plant-care": {
          slug: "plant-care",
          title: "Plant Care & Maintenance",
          desc: "Keep your plants healthy and thriving with our expert care.",
          details: "Our plant care service includes watering, pruning, fertilization, and pest control to ensure your plants stay vibrant all year round.",
          image: "/images/plant-care.jpg",
          packages: [
            { name: "Basic Care", desc: "Weekly watering and pruning for small gardens.", price: 499 },
            { name: "Premium Care", desc: "Comprehensive care including fertilization and pest control.", price: 999 }
          ],
          isActive: true
        },
        "home-decor": {
          slug: "home-decor",
          title: "Home Decor & Styling",
          desc: "Elevate your living spaces with elegant, plant-inspired decor.",
          details: "We design and style homes with lush greenery, natural accents, and premium plant-based decor that brings warmth and sophistication to your interiors.",
          image: "/images/home-decor.jpg",
          packages: [
            { name: "Living Room Styling", desc: "Transform your living room with curated plants, accent pieces, and cozy layouts.", price: 2499 },
            { name: "Bedroom Decor", desc: "Create a calming, nature-inspired bedroom with elegant plant styling.", price: 1499 },
            { name: "Balcony & Outdoor Styling", desc: "Design refreshing balcony and patio spaces with greenery and decor accents.", price: 999 }
          ],
          isActive: true
        },
        "landscaping": {
          slug: "landscaping",
          title: "Landscaping & Garden Design",
          desc: "Create stunning outdoor spaces with our expert landscaping.",
          details: "From concept to completion, we design and build gardens that inspire.",
          image: "/images/landscaping.jpg",
          packages: [
            { name: "Basic Landscaping", desc: "Simple layouts for small spaces.", price: 4999 },
            { name: "Premium Landscaping", desc: "Full-scale design with premium plants and features.", price: 9999 }
          ],
          isActive: true
        }
      };
      
      const slug = req.params.slug.toLowerCase();
      if (mockServices[slug]) {
        console.warn(`⚠️  Service not found in database, using mock data for ${slug}`);
        return res.json(mockServices[slug]);
      }
      
      return res.status(404).json({ message: "Service not found" });
    }
    
    res.json(service);
  } catch (err) {
    console.error("Error fetching service:", err);
    // Return mock service data on error
    const mockServices = {
      "plant-care": {
        slug: "plant-care",
        title: "Plant Care & Maintenance",
        desc: "Keep your plants healthy and thriving with our expert care.",
        details: "Our plant care service includes watering, pruning, fertilization, and pest control to ensure your plants stay vibrant all year round.",
        image: "/images/plant-care.jpg",
        packages: [
          { name: "Basic Care", desc: "Weekly watering and pruning for small gardens.", price: 499 },
          { name: "Premium Care", desc: "Comprehensive care including fertilization and pest control.", price: 999 }
        ],
        isActive: true
      },
      "home-decor": {
        slug: "home-decor",
        title: "Home Decor & Styling",
        desc: "Elevate your living spaces with elegant, plant-inspired decor.",
        details: "We design and style homes with lush greenery, natural accents, and premium plant-based decor that brings warmth and sophistication to your interiors.",
        image: "/images/home-decor.jpg",
        packages: [
          { name: "Living Room Styling", desc: "Transform your living room with curated plants, accent pieces, and cozy layouts.", price: 2499 },
          { name: "Bedroom Decor", desc: "Create a calming, nature-inspired bedroom with elegant plant styling.", price: 1499 },
          { name: "Balcony & Outdoor Styling", desc: "Design refreshing balcony and patio spaces with greenery and decor accents.", price: 999 }
        ],
        isActive: true
      },
      "landscaping": {
        slug: "landscaping",
        title: "Landscaping & Garden Design",
        desc: "Create stunning outdoor spaces with our expert landscaping.",
        details: "From concept to completion, we design and build gardens that inspire.",
        image: "/images/landscaping.jpg",
        packages: [
          { name: "Basic Landscaping", desc: "Simple layouts for small spaces.", price: 4999 },
          { name: "Premium Landscaping", desc: "Full-scale design with premium plants and features.", price: 9999 }
        ],
        isActive: true
      }
    };
    
    const slug = req.params.slug.toLowerCase();
    if (mockServices[slug]) {
      console.warn(`⚠️  Error fetching service ${slug}, using mock data:`, err.message);
      return res.json(mockServices[slug]);
    }
    
    res.status(500).json({ message: "Failed to fetch service", error: err.message });
  }
});

export default router;
