// /api/send-proposal.js
const { jsPDF } = require("jspdf");
const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');

// --- NODEMAILER CONFIGURATION ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for others
  auth: {
    user: process.env.EMAIL_USER, // "apikey"
    pass: process.env.EMAIL_PASS, // Your SendGrid API Key
  },
});
// ----------------------------------

// This is the main function Vercel will run
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const formData = req.body;

  try {
    // --- 1. GENERATE PDF ON THE SERVER ---
    // Load the header image from the /images folder
    const imagePath = path.join(process.cwd(), 'images', 'pdf-header.png');
    const headerImgData = fs.readFileSync(imagePath);

    const doc = new jsPDF();
    const imgWidth = 210, imgHeight = 34.5;
    doc.addImage(headerImgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // --- Title Section (from your new script.js) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Set to black
    doc.text("EUNOIA", 105, 50, { align: 'center' });
    doc.setFontSize(12);
    doc.text("By HR Yaar", 105, 57, { align: 'center' });
    doc.text(`Prepared for: ${formData.company}`, 105, 64, { align: 'center' });

    // --- To Section (from your new script.js) ---
    doc.setFontSize(11);
    doc.text("To,", 20, 80);
    doc.text(`${formData.name}`, 20, 86);
    doc.text(`${formData.designation}`, 20, 92);
    doc.text(`${formData.company}`, 20, 98);
    doc.text(`${formData.contact}`, 20, 104);

    // --- Event Overview (from your new script.js) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Event Overview", 20, 118);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Preferred Date: TBD (To be decided)", 20, 126);
    doc.text("Event Timings: TBD (To be decided)", 20, 132);

    let yPos = 146;

    // --- Itinerary (from your new script.js) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Proposed Itinerary", 20, yPos);
    yPos += 10;

    const selectedItems = formData.initiatives;
    const hasForest = selectedItems.some(item => item.name.includes("Forest Bathing"));
    const hasCeoDinner = selectedItems.some(item => item.name.includes("CEO"));
    const hasVipDinner = selectedItems.some(item => item.name.includes("VIP"));

    // Activity Descriptions Map
    const activityDescriptions = {
      "Forest Bathing": "A guided nature immersion that awakens the senses and centres attention.",
      "Mindfulness through Eating": "A guided sensory experience to cultivate a healthy, present relationship with food and reduce stress.",
      "Mindfulness through Art Therapy": "An expressive arts session that invites reflection and creativity through colour, movement, and form.",
      "Sound Therapy & Mindful Listening": "Immerse in live acoustic instruments and sound vibrations that harmonise internal rhythms.",
      "Music Performance": "A sophisticated live music session to create a relaxing and elegant atmosphere.",
      "Laughter Therapy": "An interactive session using guided laughter exercises to boost morale, reduce stress, and foster team bonding.",
      "Yoga": "A restorative session focusing on flexibility, breathing, and mindfulness to rejuvenate the body and mind.",
      "Tai Chi": "A gentle, flowing 'meditation in motion' to improve balance, reduce stress, and enhance mental clarity.",
      "Power of Mind": "A workshop on mindset, visualization, and resilience to help teams overcome challenges and achieve goals.",
      "Care Package": "Curated wellness and appreciation kits delivered to each employee to show gratitude and support well-being.",
      "Company Branded Merchandise": "High-quality, desirable swag that builds brand pride and fosters a sense of unity and belonging.",
      "CEO / Director's Curated Dinner": "An exclusive, high-level networking and strategy dinner hosted in a premium setting.",
      "VIP Guest for Dinner": "An inspirational evening with an industry leader or special guest, combined with a premium dining experience."
    };

    // Itinerary Building
    const itineraryParts = [];
    if (hasForest) {
      itineraryParts.push(`• Forest Bathing: ${activityDescriptions["Forest Bathing"]}\n\n`);
    }
    itineraryParts.push("• Breakfast (Included)\n\n");
    selectedItems.forEach(item => {
      if (!item.name.includes("Forest Bathing") && !item.name.includes("Dinner")) {
        const desc = activityDescriptions[item.name] || "A thoughtfully curated experience promoting mindfulness and engagement.";
        itineraryParts.push(`• ${item.name}: ${desc}\n\n`);
      }
    });
    itineraryParts.push("• Lunch (Included)\n\n");
    if (hasCeoDinner) {
      itineraryParts.push(`• CEO / Director's Curated Dinner: ${activityDescriptions["CEO / Director's Curated Dinner"]}\n\n`);
    } else if (hasVipDinner) {
      itineraryParts.push(`• VIP Guest for Dinner: ${activityDescriptions["VIP Guest for Dinner"]}\n\n`);
    } else {
      itineraryParts.push("• Dinner (Included)\n\n");
    }

    // Render itinerary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(itineraryParts.join(""), 170);
    doc.text(wrapped, 20, yPos);
    
    // Get the PDF as a buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // --- 2. SEND EMAIL 1 (To the User) ---
    await transporter.sendMail({
      from: `"EUNOIA" <${process.env.VERIFIED_SENDER_EMAIL}>`,
      to: formData.email, // The user's email
      subject: "Your Custom EUNOIA Proposal is Here!",
      html: `
        <p>Hi ${formData.name},</p>
        <p>Thank you for your interest in our Mindfulness & Leadership programs. Please find your custom proposal attached.</p>
        <p>Our team will reach out to you within 24 hours to discuss the next steps.</p>
        <br>
        <p>Best Regards,</p>
        <p>The EUNOIA Team</p>
      `,
      attachments: [
        {
          filename: 'EUNOIA-Proposal.pdf',
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    });

    // --- 3. SEND EMAIL 2 (To You/Admin) ---
    await transporter.sendMail({
      from: `"New Proposal Bot" <${process.env.VERIFIED_SENDER_EMAIL}>`,
      to: process.env.MY_EMAIL, // Your admin email
      subject: `New Proposal Request from: ${formData.company}`,
      html: `
        <p>A new proposal request has been generated.</p>
        <p>Please reply within 24 hours.</p>
        <hr>
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${formData.name}</li>
          <li><strong>Company:</strong> ${formData.company}</li>
          <li><strong>Email:</strong> ${formData.email}</li>
          <li><strong>Contact:</strong> ${formData.contact}</li>
        </ul>
        <hr>
        <p>The generated PDF is attached.</p>
      `,
      attachments: [
        {
          filename: 'EUNOIA-Proposal.pdf',
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    });

    // --- 4. SEND SUCCESS RESPONSE ---
    res.status(200).json({ message: "Proposal sent successfully!" });

  } catch (error) {
    console.error("Error generating PDF or sending email:", error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
}