document.addEventListener("DOMContentLoaded", () => {
  const { jsPDF } = window.jspdf;

  // --- Activity Data ---
  const activities = [
    { id: "pkg1", name: "Forest Bathing", description: "A guided nature immersion that awakens the senses and centres attention.", isCeoDinner: false, img: "./images/forest-bathing.png" },
    { id: "pkg2", name: "Mindfulness through Eating", description: "A guided sensory experience to cultivate a healthy, present relationship with food and reduce stress.", isCeoDinner: false, img: "./images/mindful-eating.png" },
    { id: "pkg3", name: "Mindfulness through Art Therapy", description: "An expressive arts session that invites reflection and creativity through colour, movement, and form.", isCeoDinner: false, img: "./images/art-therapy.png" },
    { id: "pkg4", name: "Sound Therapy & Mindful Listening", description: "Immerse in live acoustic instruments and sound vibrations that harmonise internal rhythms.", isCeoDinner: false, img: "./images/sound-bath.png" },
    { id: "pkg5", name: "Music Performance", description: "A sophisticated live music session (e.g., classical, jazz, or acoustic) to create a relaxing and elegant atmosphere.", isCeoDinner: false, img: "./images/music-performance-image.png" },
    { id: "pkg6", name: "Laughter Therapy", description: "An interactive session using guided laughter exercises to boost morale, reduce stress, and foster team bonding.", isCeoDinner: false, img: "./images/laughter-therapy.png" },
    { id: "pkg7", name: "Yoga", description: "A restorative session focusing on flexibility, breathing, and mindfulness to rejuvenate the body and mind.", isCeoDinner: false, img: "./images/yoga.png" },
    { id: "pkg8", name: "Tai Chi", description: "A gentle, flowing 'meditation in motion' to improve balance, reduce stress, and enhance mental clarity.", isCeoDinner: false, img: "./images/tai-chi.png" },
    { id: "pkg9", name: "Power of Mind", description: "A workshop on mindset, visualization, and resilience to help teams overcome challenges and achieve goals.", isCeoDinner: false, img: "./images/power-of-mind.png" },
    { id: "pkg10", name: "Care Package", description: "Curated wellness and appreciation kits delivered to each employee to show gratitude and support well-being.", isCeoDinner: false, img: "./images/care-package.png" },
    { id: "pkg11", name: "Company Branded Merchandise", description: "High-quality, desirable swag that builds brand pride and fosters a sense of unity and belonging.", isCeoDinner: false, img: "./images/company-branded-merchandise.png" },
    { id: "pkg12-ceo", name: "CEO / Director's Curated Dinner", description: "An exclusive, high-level networking and strategy dinner hosted in a premium setting.", isCeoDinner: true, img: "./images/ceo-dinner.png" },
    { id: "pkg13-vip", name: "VIP Guest for Dinner", description: "An inspirational evening with an industry leader or special guest, combined with a premium dining experience.", isCeoDinner: true, img: "./images/vip-guest-dinner.png" }
  ];

  let selectedItems = [];

  // --- DOM Elements ---
  const packageContainer = document.getElementById("package-container");
  const selectedItemsContainer = document.getElementById("selected-items");
  const proposalRequestBtn = document.getElementById("proposal-request-btn");
  const proposalForm = document.getElementById("proposal-form");
  const formMessage = document.getElementById("form-message");
  const headerImg = document.getElementById('pdf-header-image');
  const contactInput = document.getElementById("user-contact");
  let headerImgData = null;

  // --- Preload Header Image ---
  headerImg.addEventListener('load', () => {
    const canvas = document.createElement('canvas');
    canvas.width = headerImg.naturalWidth;
    canvas.height = headerImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(headerImg, 0, 0);
    headerImgData = canvas.toDataURL('image/png');
  });
  if (headerImg.complete && headerImg.naturalWidth > 0) {
    headerImg.dispatchEvent(new Event('load'));
  }

  // --- Render Activity Cards ---
  function renderPackages() {
    packageContainer.innerHTML = activities.map(activity => `
      <div class="package-card">
        <img src="${activity.img}" alt="${activity.name}">
        <div class="package-card-content">
          <h4>${activity.name}</h4>
          <p class="pkg-description">${activity.description}</p>
          <button class="add-btn" data-id="${activity.id}">+</button>
        </div>
      </div>
    `).join('');
  }

  // --- Selection Logic ---
  document.addEventListener("click", (e) => {
    if (e.target.matches(".add-btn") && !e.target.classList.contains("added")) {
      const activityId = e.target.dataset.id;
      addActivity(activityId, e.target);
    } else if (e.target.matches(".remove-btn")) {
      const activityId = e.target.dataset.id;
      removeActivity(activityId);
    }
  });

  function addActivity(activityId, buttonElement) {
    const activity = activities.find(item => item.id === activityId);
    if (activity && selectedItems.find(item => item.id === activityId)) {
      showMessage("This activity has already been selected.", "error");
      setTimeout(() => showMessage("", ""), 2000);
      return;
    }
    if (activity) {
      selectedItems.push(activity);
      buttonElement.textContent = "✓ Added";
      buttonElement.classList.add("added");
      updateSummary();
    }
  }

  function removeActivity(activityId) {
    selectedItems = selectedItems.filter(item => item.id !== activityId);
    const addButton = document.querySelector(`.add-btn[data-id="${activityId}"]`);
    if (addButton) {
      addButton.textContent = "+";
      addButton.classList.remove("added");
    }
    updateSummary();
  }

  function updateSummary() {
    if (selectedItems.length === 0) {
      selectedItemsContainer.innerHTML = '<p class="empty-message">No initiatives selected yet.</p>';
    } else {
      selectedItemsContainer.innerHTML = selectedItems.map(item => `
        <div class="selected-item">
          <div class="item-info">
            <h4>${item.name}</h4>
          </div>
          <button class="remove-btn" data-id="${item.id}">Remove</button>
        </div>
      `).join("");
    }
    proposalRequestBtn.disabled = selectedItems.length === 0;
  }

  // --- Show Form ---
  proposalRequestBtn.addEventListener("click", () => {
    proposalRequestBtn.classList.add("hidden");
    proposalForm.classList.remove("hidden");
    showMessage("", "");
  });

  // --- Input Validation ---
  contactInput.addEventListener("input", (e) => {
    if (e.target.value.length >= 10) {
      e.target.classList.remove("input-invalid");
    } else {
      e.target.classList.add("input-invalid");
    }
  });

  // --- PDF Generation ---
  proposalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const finalSubmitBtn = document.getElementById("final-submit-btn");
    const contactValue = document.getElementById("user-contact").value;

    if (contactValue.length < 10) {
      showMessage("Please enter a valid 10-digit contact number.", "error");
      return;
    }
    if (!window.jspdf || !headerImgData) {
      showMessage("PDF assets not ready. Please refresh.", "error");
      return;
    }

    const { jsPDF } = window.jspdf;
    const formData = {
      name: document.getElementById("user-name").value,
      designation: document.getElementById("user-designation").value,
      company: document.getElementById("user-company").value,
      contact: contactValue,
      email: document.getElementById("user-email").value,
      location: document.getElementById("user-location").value,
      initiatives: selectedItems,
    };

    finalSubmitBtn.disabled = true;
    finalSubmitBtn.textContent = 'Generating PDF...';

    try {
      const doc = new jsPDF();
      const imgWidth = 210, imgHeight = 34.5;
      doc.addImage(headerImgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // --- Title Section ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("EUNOIA", 105, 50, { align: 'center' });

      doc.setFontSize(12);
      doc.text("By HR Yaar", 105, 57, { align: 'center' });
      doc.text(`Prepared for: ${formData.company}`, 105, 64, { align: 'center' });

      // --- To Section ---
      doc.setFontSize(11);
      doc.text("To,", 20, 80);
      doc.text(`${formData.name}`, 20, 86);
      doc.text(`${formData.designation}`, 20, 92);
      doc.text(`${formData.company}`, 20, 98);
      doc.text(`${formData.contact}`, 20, 104);

      // --- Event Overview ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Event Overview", 20, 118);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Preferred Date: TBD (To be decided)", 20, 126);
      doc.text("Event Timings: TBD (To be decided)", 20, 132);

      let yPos = 146;

      // --- Itinerary ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Proposed Itinerary", 20, yPos);
      yPos += 10;

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

      // 1️⃣ Forest Bathing (if selected)
      if (hasForest) {
        itineraryParts.push(`• Forest Bathing: ${activityDescriptions["Forest Bathing"]}\n\n`);
      }

      // 2️⃣ Breakfast (always)
      itineraryParts.push("• Breakfast (Included)\n\n");

      // 3️⃣ Other activities (excluding forest bathing and dinners)
      selectedItems.forEach(item => {
        if (!item.name.includes("Forest Bathing") && !item.name.includes("Dinner")) {
          const desc = activityDescriptions[item.name] || "A thoughtfully curated experience promoting mindfulness and engagement.";
          itineraryParts.push(`• ${item.name}: ${desc}\n\n`);
        }
      });

      // 4️⃣ Lunch
      itineraryParts.push("• Lunch (Included)\n\n");

      // 5️⃣ Dinner logic
      if (hasCeoDinner) {
        itineraryParts.push(`• CEO / Director's Curated Dinner: ${activityDescriptions["CEO / Director's Curated Dinner"]}\n\n`);
      } else if (hasVipDinner) {
        itineraryParts.push(`• VIP Guest for Dinner: ${activityDescriptions["VIP Guest for Dinner"]}\n\n`);
      } else {
        itineraryParts.push("• Dinner (Included)\n\n");
      }

      // --- Render itinerary
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(itineraryParts.join(""), 170);
      doc.text(wrapped, 20, yPos);

      doc.save("EUNOIA-Proposal.pdf");
      showMessage("Thank you! Your proposal has been downloaded successfully.", "success");
      resetForm();

    } catch (err) {
      console.error("PDF Generation Error:", err);
      showMessage("Sorry, there was an error generating your PDF.", "error");
    } finally {
      finalSubmitBtn.disabled = false;
      finalSubmitBtn.textContent = 'Submit';
    }
  });

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
  }

  function resetForm() {
    selectedItems = [];
    document.querySelectorAll(".add-btn.added").forEach(btn => {
      btn.textContent = "+";
      btn.classList.remove("added");
    });
    updateSummary();
    proposalForm.reset();
    proposalForm.classList.add("hidden");
    proposalRequestBtn.classList.remove("hidden");
    contactInput.classList.remove("input-invalid");
  }

  renderPackages();
  updateSummary();
});
